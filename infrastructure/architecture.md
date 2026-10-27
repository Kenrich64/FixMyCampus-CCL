# FixMyCampus — AWS Cloud Architecture Specification

## 1. Executive Summary

**FixMyCampus** is a resilient, cloud-hosted campus infrastructure complaint and maintenance tracking system designed for a college Cloud Computing practical assessment. The architecture purposefully uses a hybrid model of IaaS (compute on Amazon EC2 within a custom VPC) and AWS managed services (Amazon RDS, Amazon S3, Amazon SQS, Amazon SNS, AWS Systems Manager, Amazon CloudWatch, and AWS Budgets).

This design ensures:
1. **Genuine Cloud Architecture**: Avoids pure serverless black-boxes while maintaining high operational control.
2. **Strict Network Isolation**: Databases are placed in private subnets with no public internet ingress.
3. **Least-Privilege Security**: EC2 IAM Instance Profile is used; zero hard-coded credentials exist in source code.
4. **Cost-Conscious Design**: Avoids expensive NAT Gateways and Multi-AZ database overhead, fitting neatly within academic lab allowances.

---

## 2. Architecture & Data Flow Diagram

```mermaid
flowchart TB
    subgraph Users["Campus Clients"]
        Student["Student Browser"]
        Admin["Administrator Browser"]
    end

    subgraph AWS["AWS Cloud (us-east-1)"]
        subgraph VPC["Custom VPC (10.0.0.0/16)"]
            IGW["Internet Gateway"]

            subgraph PublicSubnet["Public Subnet (10.0.1.0/24 - AZ-a)"]
                subgraph EC2Instance["Amazon EC2 (t3.micro / t4g.micro)"]
                    AppServer["Node.js / Express API Server (:5000)"]
                    Worker["Background SQS Notification Worker"]
                    StaticUI["Vite React Client Assets"]
                end
                EC2_SG["EC2 Security Group<br/>Inbound: 80, 5000 (HTTP), 22 (SSH MyIP)"]
            end

            subgraph PrivateSubnets["Private DB Subnets (Multi-AZ Group)"]
                subgraph PrivateSubnet1["Private Subnet A (10.0.10.0/24 - AZ-a)"]
                    RDSPrimary[("Amazon RDS PostgreSQL<br/>(db.t4g.micro)")]
                end
                subgraph PrivateSubnet2["Private Subnet B (10.0.11.0/24 - AZ-b)"]
                    RDSBackup["Standby Allocation Subnet"]
                end
                RDS_SG["RDS Security Group<br/>Inbound: 5432 ONLY from EC2_SG"]
            end
        end

        subgraph ManagedServices["AWS Managed Cloud Services"]
            S3Bucket[("Amazon S3<br/>Private Evidence Bucket")]
            SQSQueue["Amazon SQS<br/>fixmycampus-notifications"]
            SNSTopic["Amazon SNS<br/>fixmycampus-alerts"]
            SSM["AWS SSM Parameter Store<br/>/fixmycampus/* (SecureString)"]
            CloudWatch["Amazon CloudWatch<br/>Logs & Metric Alarms"]
            Budgets["AWS Budgets<br/>Monthly Spend Cap & Alerts"]
        end
    end

    %% Network flows
    Student -->|HTTP / HTTPS| IGW
    Admin -->|HTTP / HTTPS| IGW
    IGW --> AppServer

    %% EC2 to Internal & Managed
    AppServer -->|TCP 5432 (SSL)| RDSPrimary
    AppServer -.->|Fetch Secrets on Boot| SSM
    AppServer -->|Log Requests & Errors| CloudWatch
    Worker -->|Log Worker Heartbeat| CloudWatch

    %% S3 Direct Upload Flow
    AppServer -->|Generate Presigned PUT/GET URLs| S3Bucket
    Student -->|Direct Browser-to-S3 Upload| S3Bucket

    %% Asynchronous Processing Loop
    AppServer -->|1. Enqueue Notification Job| SQSQueue
    SQSQueue -->|2. Long Poll Messages| Worker
    Worker -->|3. Publish Alert| SNSTopic
    Worker -->|4. Delete on Success| SQSQueue
    SNSTopic -->|Email Notification| Student
    SNSTopic -->|Email Notification| Admin
```

---

## 3. AWS Services Catalog & Functional Roles

| Service | Category | Specific Role in FixMyCampus | Cost Optimization Decision |
| :--- | :--- | :--- | :--- |
| **Amazon VPC** | Networking | Custom 10.0.0.0/16 private network isolating compute and database workloads. | Free; native VPC isolation. |
| **Public Subnet** | Networking | Houses EC2 instance with public IPv4 and direct routing to Internet Gateway. | Single subnet in AZ-a; no multi-AZ duplicate fees. |
| **Private Subnets** | Networking | Two subnets across two AZs (10.0.10.0/24 and 10.0.11.0/24) satisfying RDS DB Subnet Group requirements. | Zero internet route; database completely shielded from external attacks. |
| **Internet Gateway** | Networking | Allows inbound student/admin traffic and outbound access to AWS API endpoints. | Free attached resource. |
| **Security Groups** | Security | Stateful virtual firewalls restricting EC2 to HTTP/SSH and RDS to port 5432 *strictly from EC2 SG*. | Free; defense-in-depth perimeter. |
| **Amazon EC2** | Compute | Runs Express backend API, serves compiled Vite React frontend, and runs background worker daemon. | `t4g.micro` / `t3.micro` instance. |
| **Amazon RDS** | Managed DB | Hosts relational PostgreSQL engine (users, complaints, audit history timeline). | Single-AZ deployment; avoids expensive Multi-AZ standby replica. |
| **Amazon S3** | Storage | Private object bucket storing complaint evidence photos. Access granted via short-lived Presigned URLs. | Private bucket; no public S3 egress charges. |
| **Amazon SQS** | Messaging | Decouples complaint registration from notification delivery. Buffers jobs for worker. | Pay-per-request; 1 million free requests/month. |
| **Amazon SNS** | Messaging | Broadcasts maintenance status updates and critical alerts to subscribed email addresses. | Free tier covers first 1,000 email notifications. |
| **AWS SSM Parameter Store** | Security/Config | Stores sensitive JWT secret and database passwords in encrypted `SecureString` parameters. | Standard parameters are completely free of charge. |
| **Amazon CloudWatch** | Monitoring | Ingests structured JSON logs and triggers alarms on high EC2 CPU utilization or queue depth. | Within standard free tier log ingestion limits. |
| **AWS Budgets** | Cost Governance | Tracks actual vs forecast spend, dispatching proactive threshold alerts to student email. | First two budgets per account are free. |

---

## 4. Key Architectural Decisions (Viva Highlights)

### Why No NAT Gateway?
A managed AWS NAT Gateway costs approximately **$32.40/month** plus data processing fees ($0.045/hour). Because this is an academic demonstration project, placing the EC2 instance in a public subnet allows it to access AWS APIs (S3, SQS, SNS, SSM, CloudWatch) directly via the Internet Gateway without needing a NAT Gateway. The RDS database remains in private subnets with no public IP address, ensuring 100% database security at zero extra networking cost.

### Why SQS + Background Worker + SNS (Decoupled Messaging)?
If email delivery was attempted synchronously inside the HTTP `POST /api/complaints` request handler:
1. High network latency from SMTP/SES/SNS would delay the student's browser response by 2–5 seconds.
2. If an external email provider experienced temporary downtime, the student's complaint submission would fail.
3. FixMyCampus saves the complaint transactionally in PostgreSQL first, enqueues a lightweight message into Amazon SQS, and responds to the browser in under **50ms**. The background worker consumes SQS asynchronously, delivers through SNS, and deletes the message only upon verified delivery. If the queue is temporarily down, the complaint record remains safely preserved in PostgreSQL.

### Why Direct-to-S3 Presigned URLs?
Routing large image uploads (up to 5MB) through the Node.js server would saturate EC2 network bandwidth and CPU memory. By requesting a short-lived presigned PUT URL from the server and uploading directly from the student's browser to S3, server resources are preserved and object security remains strictly enforced.
