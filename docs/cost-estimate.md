# FixMyCampus — AWS Cost Estimation & Budget Management

## 1. Important Notice on AWS Costs
> **CRITICAL REALITY**: While FixMyCampus is architected to leverage AWS Free Tier allocations wherever possible, **no genuine cloud project should ever be promised as 100% free**. New AWS pricing policies (such as charges for public IPv4 addresses) and persistent storage (EBS and RDS volumes) can incur small charges. 

Follow this guide to set a strict budget alarm and understand exact monthly costs.

---

## 2. Monthly Cost Estimation Breakdown (us-east-1)

Assumes continuous execution for one month (730 hours):

| AWS Resource | Configuration | Free Tier Coverage | Estimated Monthly Cost (With Free Tier) | Estimated Monthly Cost (Without Free Tier) |
| :--- | :--- | :--- | :--- | :--- |
| **Amazon EC2 Compute** | `t4g.micro` or `t3.micro` | 750 hours/month free (first 12 mos) | **$0.00** | ~$7.50 / month |
| **Amazon EC2 Public IPv4** | 1 In-use Public IPv4 address | **NOT FREE** ($0.005 / hour) | **~$3.65** | ~$3.65 / month |
| **Amazon EBS Boot Volume** | 10 GB gp3 storage | 30 GB free across account | **$0.00** | ~$0.80 / month |
| **Amazon RDS PostgreSQL** | `db.t4g.micro`, Single-AZ, 20GB gp3 | 750 hours DB + 20GB storage free | **$0.00** | ~$13.50 / month |
| **Amazon S3 Evidence Bucket** | 1 GB storage + 2,000 PUT/GETs | 5 GB storage + 20,000 GETs free | **$0.00** | ~$0.03 / month |
| **Amazon SQS Notification Queue**| 5,000 messages / month | 1,000,000 requests free forever | **$0.00** | **$0.00** |
| **Amazon SNS Maintenance Alerts**| 500 emails / month | 1,000 email deliveries free / mo | **$0.00** | **$0.00** |
| **AWS Systems Manager** | Standard Parameter Store | Free forever | **$0.00** | **$0.00** |
| **Amazon CloudWatch Logs** | 100 MB ingested logs | 5 GB ingestion free forever | **$0.00** | **$0.00** |
| **AWS NAT Gateway** | **EXCLUDED BY DESIGN** | N/A ($0.045/hr + data) | **$0.00 (Saved $32.40/mo!)** | **$0.00 (Saved $32.40/mo!)** |
| **ESTIMATED TOTAL** | | | **~$3.65 - $5.00 / month** | **~$25.50 / month** |

---

## 3. How FixMyCampus Minimizes Costs

1. **Eliminated NAT Gateway**:
   By assigning a public IP to EC2 in the public subnet, the application communicates with AWS S3, SQS, SNS, and CloudWatch directly via the Internet Gateway. This single architectural decision saves **$32.40/month** compared to typical enterprise architectures.
2. **Single-AZ RDS Deployment**:
   Multi-AZ creates a synchronous standby replica in another zone, doubling RDS costs. Since this is an academic practical, Single-AZ satisfies all requirements at half the price.
3. **Short-Lived Direct-to-S3 Uploads**:
   Images go straight from the browser to S3, eliminating EC2 network egress fees and memory bloat.

---

## 4. Why Stopping an EC2 Instance Does NOT Stop All Charges
Students often mistakenly assume that stopping an EC2 instance stops all billing. **This is false!**
* **EBS Storage**: Your 10–20 GB root volume remains provisioned and attached, continuing to incur EBS storage fees.
* **Amazon RDS**: The PostgreSQL database remains running unless explicitly stopped. Even if stopped, RDS will automatically restart after 7 days!
* **Public IPv4**: In some configurations, idle or stopped instances with detached elastic IPs incur fees.

---

## 5. Setting Up an AWS Budget & Billing Alarm (Step-by-Step)

1. Open the **AWS Billing and Cost Management Console**.
2. Click **Budgets** in the navigation pane &rarr; **Create budget**.
3. Choose **Customize (advanced)** &rarr; **Cost budget** &rarr; Next.
4. Configure Budget:
   * **Budget name**: `FixMyCampus-Monthly-Budget`
   * **Period**: Monthly
   * **Budget effective date**: Recurring budget
   * **Budgeted amount**: `$10.00` (or `$5.00` if on strict lab credits)
5. Configure Alerts:
   * **Alert 1 (Actual Spend)**: Trigger at **80%** ($8.00) of budgeted amount.
   * **Notification email**: Enter your college and personal email.
   * **Alert 2 (Forecasted Spend)**: Trigger if forecasted spend exceeds **100%** ($10.00).
6. Click **Confirm and create budget**.
7. Check your email inbox to verify the SNS budget subscription.

---

## 6. Complete Resource Teardown Checklist (Post-Assessment)

When your faculty assessment is complete, delete resources in this exact sequence to ensure zero ongoing charges:

- [ ] **1. Amazon EC2**: Terminate instance `fixmycampus-app-server` (This automatically deletes the attached EBS root volume if DeleteOnTermination is true).
- [ ] **2. Amazon RDS**: Delete database `fixmycampus-db`. Uncheck "Create final snapshot" and check "I acknowledge that upon instance deletion, automated backups are no longer available".
- [ ] **3. Amazon S3**: Empty bucket `fixmycampus-evidence-*` first, then click **Delete bucket**.
- [ ] **4. Amazon SQS**: Delete queue `fixmycampus-notifications`.
- [ ] **5. Amazon SNS**: Delete topic `fixmycampus-alerts` and any email subscriptions.
- [ ] **6. Amazon CloudWatch**: Delete log groups `/fixmycampus/app` and `/fixmycampus/worker`.
- [ ] **7. AWS Systems Manager**: Delete parameters `/fixmycampus/*`.
- [ ] **8. Amazon VPC**: Detach and delete `fixmycampus-igw`, then delete `fixmycampus-vpc` (This automatically deletes subnets and route tables).
- [ ] **9. Check AWS Billing Console**: Open Billing Dashboard 24 hours later to verify active monthly spend is $0.00.
