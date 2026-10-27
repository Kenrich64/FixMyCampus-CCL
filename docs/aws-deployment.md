# FixMyCampus — Step-by-Step AWS Deployment Guide

This guide provides exact, beginner-friendly instructions for deploying FixMyCampus manually using the AWS Management Console or AWS CLI.

---

## 1. Network Setup (Amazon VPC)

### Step 1.1: Create Custom VPC
1. Navigate to **VPC Console** &rarr; **Create VPC**.
2. Select **VPC only**.
3. **Name tag**: `fixmycampus-vpc`
4. **IPv4 CIDR block**: `10.0.0.0/16`
5. Click **Create VPC**.

### Step 1.2: Create Subnets
Create 3 subnets within `fixmycampus-vpc`:
* **Public Subnet (EC2)**:
  * Name: `fixmycampus-public-1a`
  * Availability Zone: `us-east-1a`
  * IPv4 CIDR: `10.0.1.0/24`
* **Private Subnet 1 (RDS)**:
  * Name: `fixmycampus-private-1a`
  * Availability Zone: `us-east-1a`
  * IPv4 CIDR: `10.0.10.0/24`
* **Private Subnet 2 (RDS)**:
  * Name: `fixmycampus-private-1b`
  * Availability Zone: `us-east-1b`
  * IPv4 CIDR: `10.0.11.0/24`

*(Tip: In `fixmycampus-public-1a`, click **Actions** &rarr; **Edit subnet settings** &rarr; Check **Enable auto-assign public IPv4 address**).*

### Step 1.3: Internet Gateway & Route Tables
1. Go to **Internet Gateways** &rarr; **Create internet gateway** (`fixmycampus-igw`).
2. Select `fixmycampus-igw` &rarr; **Actions** &rarr; **Attach to VPC** &rarr; Select `fixmycampus-vpc`.
3. Go to **Route Tables**:
   * Select the public route table &rarr; Edit routes &rarr; **Add route**:
     * Destination: `0.0.0.0/0`
     * Target: `Internet Gateway` (`fixmycampus-igw`)
   * Associate Subnet: `fixmycampus-public-1a`.
4. Ensure the private route table associated with `10.0.10.0/24` and `10.0.11.0/24` has **NO** route to 0.0.0.0/0.

---

## 2. Security Groups

### Step 2.1: EC2 Application Security Group (`fixmycampus-ec2-sg`)
* **VPC**: `fixmycampus-vpc`
* **Inbound Rules**:
  * **HTTP** (TCP 80): Source `0.0.0.0/0` (public access to campus portal via reverse proxy)
  * **SSH** (TCP 22): Source `My IP` (e.g. `203.0.113.25/32` — NEVER use `0.0.0.0/0`!)
    * *Recommended alternative:* Attach `AmazonSSMManagedInstanceCore` to the instance profile and use AWS Systems Manager Session Manager for SSH-less, zero-open-port management.
  * **Custom TCP 5000**: **Do NOT expose to 0.0.0.0/0.** Node.js runs locally on port 5000 behind Nginx on port 80. Port 5000 is kept private to `127.0.0.1` unless specifically required for temporary direct testing (in which case restrict strictly to your specific administrative IP).
* **Outbound Rules**:
  * All traffic to `0.0.0.0/0`

### Step 2.2: RDS Database Security Group (`fixmycampus-rds-sg`)
* **VPC**: `fixmycampus-vpc`
* **Inbound Rules**:
  * **PostgreSQL** (TCP 5432): Source &rarr; Select `fixmycampus-ec2-sg` (Security Group reference)
  * *(CRITICAL: Never allow 0.0.0.0/0 or public IP ranges! RDS must only accept connections originating from the EC2 security group.)*
* **Outbound Rules**:
  * All traffic to `0.0.0.0/0`

---

## 3. Managed Database (Amazon RDS PostgreSQL)

1. Navigate to **RDS Console** &rarr; **Subnet groups** &rarr; **Create DB Subnet Group**:
   * Name: `fixmycampus-db-subnets`
   * VPC: `fixmycampus-vpc`
   * Add subnets: Select `us-east-1a` (`10.0.10.0/24`) and `us-east-1b` (`10.0.11.0/24`).
2. Go to **Databases** &rarr; **Create database**:
   * Engine: **PostgreSQL** (version 15 or 16)
   * Templates: **Free tier** (or Dev/Test)
   * DB instance identifier: `fixmycampus-db`
   * Master username: `postgres`
   * Master password: `<ChooseSecurePassword>` (Save to Parameter Store in Step 7)
   * Instance configuration: `db.t4g.micro` or `db.t3.micro`
   * Storage: 20 GiB gp3
   * Connectivity:
     * VPC: `fixmycampus-vpc`
     * DB Subnet Group: `fixmycampus-db-subnets`
     * Public access: **No** (Database remains 100% private in isolated subnets)
     * VPC Security Group: Choose existing &rarr; `fixmycampus-rds-sg`
   * Initial database name: `fixmycampus`
3. Click **Create database** (Takes 5–10 minutes). Note the RDS Endpoint.

---

## 4. Private S3 Evidence Bucket

1. Navigate to **S3 Console** &rarr; **Create bucket**:
   * Bucket name: `fixmycampus-evidence-<your-name>-<random-id>` (Bucket names must be globally unique!)
   * Region: `us-east-1`
   * Block Public Access: **Keep all 4 checkmarks ENABLED** (100% Private bucket)
   * Encryption: Amazon S3 managed keys (SSE-S3)
2. Configure **CORS** on the bucket (Required for browser-to-S3 direct presigned uploads):
   * Bucket &rarr; **Permissions** &rarr; **Cross-origin resource sharing (CORS)** &rarr; Edit:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["PUT", "GET", "HEAD"],
       "AllowedOrigins": [
         "http://<YOUR-EC2-PUBLIC-IP>",
         "https://<YOUR-CAMPUS-DOMAIN>",
         "http://localhost:5173"
       ],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
   *(Note: Wildcard `*` origins are avoided in production to enforce strict origin validation.)*

---

## 5. Amazon SQS & Amazon SNS Setup

### Step 5.1: Create SQS Queue
1. Navigate to **SQS Console** &rarr; **Create queue**.
2. Type: **Standard**.
3. Name: `fixmycampus-notifications`
4. Visibility timeout: `30 seconds`
5. Message retention period: `4 days`
6. Click **Create queue**. Note the **Queue URL**.

### Step 5.2: Create SNS Topic & Email Subscription
1. Navigate to **SNS Console** &rarr; **Topics** &rarr; **Create topic**.
2. Type: **Standard**.
3. Name: `fixmycampus-alerts`
4. Display name: `FixMyCampus`
5. Click **Create topic**. Note the **Topic ARN**.
6. In the topic, click **Create subscription**:
   * Protocol: **Email**
   * Endpoint: `<YourCollegeOrPersonalEmail@example.com>`
   * Click **Create subscription**.
7. **CRITICAL STEP**: Open your email inbox and click **"Confirm subscription"** in the AWS notification email!

---

## 6. IAM Role for EC2

1. Navigate to **IAM Console** &rarr; **Roles** &rarr; **Create role**.
2. Trusted entity type: **AWS service** &rarr; Use case: **EC2**.
3. Attach policy with the permissions from [`infrastructure/iam/ec2-instance-policy.json`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/infrastructure/iam/ec2-instance-policy.json) (includes SSM, KMS decrypt for SecureStrings, S3 scoped to evidence bucket, SQS, SNS, and CloudWatch Logs).
4. Role name: `FixMyCampusEC2InstanceRole`.
5. Complete role creation.

---

## 7. Systems Manager Parameter Store

Store all production secrets securely in Parameter Store. The backend server automatically synchronizes all parameters under the `/fixmycampus` path upon startup via the EC2 IAM Role:

1. Navigate to **AWS Systems Manager** &rarr; **Parameter Store** &rarr; **Create parameter**:
   * `/fixmycampus/jwt-secret` &rarr; Type: `SecureString` &rarr; Value: `<Generate32CharSecret>`
   * `/fixmycampus/db-password` &rarr; Type: `SecureString` &rarr; Value: `<YourRDSMasterPassword>`
   * `/fixmycampus/db-host` &rarr; Type: `String` &rarr; Value: `<RDS-Endpoint-Host>`
   * `/fixmycampus/db-user` &rarr; Type: `String` &rarr; Value: `postgres`
   * `/fixmycampus/db-name` &rarr; Type: `String` &rarr; Value: `fixmycampus`
   * `/fixmycampus/s3-bucket` &rarr; Type: `String` &rarr; Value: `fixmycampus-evidence-<your-name>-<id>`
   * `/fixmycampus/sqs-url` &rarr; Type: `String` &rarr; Value: `https://sqs.us-east-1.amazonaws.com/<account-id>/fixmycampus-notifications`
   * `/fixmycampus/sns-arn` &rarr; Type: `String` &rarr; Value: `arn:aws:sns:us-east-1:<account-id>:fixmycampus-alerts`

*(Zero plaintext passwords or JWT secrets are stored in `.env` or in source code!)*

---

## 8. Launch EC2 Application Instance

1. Navigate to **EC2 Console** &rarr; **Launch an instance**:
   * Name: `fixmycampus-app-server`
   * AMI: **Amazon Linux 2023** or **Ubuntu 24.04 LTS**
   * Instance type: `t4g.micro` (ARM) or `t3.micro` (x86)
   * Key pair: Select your existing key pair (e.g. `labsuser.pem`)
   * Network settings:
     * VPC: `fixmycampus-vpc`
     * Subnet: `fixmycampus-public-1a`
     * Auto-assign public IP: **Enable**
     * Security Group: `fixmycampus-ec2-sg`
   * Advanced details:
     * IAM instance profile: `FixMyCampusEC2InstanceRole`
2. Launch instance.

---

## 9. Deploying Code on EC2

SSH into the instance:
```bash
ssh -i labsuser.pem ec2-user@<EC2-PUBLIC-IP>
```

### Step 9.1: Install Dependencies & Nginx Reverse Proxy
```bash
# On Amazon Linux 2023:
sudo dnf update -y
sudo dnf install -y git nginx
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
sudo npm install -g pm2
```

### Step 9.2: Clone and Build
```bash
git clone <your-repo-url> fixmycampus
cd fixmycampus

# Configure non-sensitive operational environment:
# (Production secrets are loaded automatically from SSM Parameter Store via IAM Role)
cat << 'EOF' > .env
NODE_ENV=production
PORT=5000
USE_AWS_SERVICES=true
AWS_REGION=us-east-1
EOF

# Install dependencies and build React static assets
npm run install:all
npm run build
```

### Step 9.3: Run Database Migrations & Initial Data
```bash
# Automatically loads /fixmycampus parameters from SSM Parameter Store
npm run migrate
npm run seed
```

### Step 9.4: Configure Nginx Reverse Proxy (Port 80 -> 127.0.0.1:5000)
```bash
sudo cp infrastructure/nginx/fixmycampus.conf /etc/nginx/conf.d/fixmycampus.conf
sudo systemctl enable --now nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Step 9.5: Start Process Management (PM2 or Systemd)

**Option A: PM2 Process Management (Recommended for Node)**
```bash
# Start API server and background notification worker
pm2 start ecosystem.config.cjs
pm2 save

# Configure PM2 to restart automatically after EC2 reboot:
# (Execute the exact command generated by pm2 startup)
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

**Option B: Standard Systemd Services**
```bash
sudo cp infrastructure/systemd/fixmycampus-api.service /etc/systemd/system/
sudo cp infrastructure/systemd/fixmycampus-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now fixmycampus-api
sudo systemctl enable --now fixmycampus-worker
```

### Step 9.6: Verify Health & Deployment
```bash
# Verify internal health check (probes database connectivity safely)
curl -i http://localhost:5000/api/health
```
Expected response:
```json
{
  "status": "healthy",
  "service": "FixMyCampus API Server",
  "environment": "production",
  "awsServicesEnabled": true,
  "database": "connected"
}
```

Now open **`http://<EC2-PUBLIC-IP>`** in your web browser!
