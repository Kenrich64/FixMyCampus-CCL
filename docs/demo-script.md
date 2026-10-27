# FixMyCampus — Faculty Demonstration Script & Viva Voce Guide

---

## 1. 5–7 Minute Faculty Demonstration Script

| Time | Phase | Screen / Action | Script & Narration |
| :--- | :--- | :--- | :--- |
| **0:00 - 1:00** | **Project Overview & Architecture** | Show Architecture Diagram in `docs/architecture.md` | *"Good morning, faculty. Today we present **FixMyCampus — Smart Campus Complaint & Maintenance Tracker**, built on AWS. Rather than a pure serverless black-box, our project demonstrates a genuine cloud infrastructure: Node.js backend on an EC2 instance in a custom VPC, PostgreSQL running on a private Amazon RDS instance, private evidence storage in Amazon S3 via presigned URLs, and asynchronous notifications processed through an Amazon SQS queue, EC2 background worker, and Amazon SNS."* |
| **1:00 - 2:00** | **Student Experience & Rule Recommendation** | Login as Student & Navigate to Report Issue | *"We start in the Student Portal. When a student reports an infrastructure defect, our rule-based expert system evaluates category and keywords in real time. Notice how typing 'bare sparking wire' immediately recommends **URGENT** priority with transparent reasoning based on campus safety policies. We also attach an evidence photograph, which uploads directly from the browser to a private Amazon S3 bucket using a temporary presigned URL."* |
| **2:00 - 3:15** | **Audit Trail & Async Decoupling** | Submit Complaint & Show SQS / Worker Terminal | *"When submitted, the complaint is assigned a unique sequential reference code `FC-2026-0001` and saved transactionally in PostgreSQL. Immediately, the API enqueues a notification job into Amazon SQS without blocking the student's browser. Look at our terminal: the background worker consumes the message, dispatches the email via Amazon SNS, and deletes the message from SQS upon verified delivery."* |
| **3:15 - 4:30** | **Administrator Operations & Analytics** | Login as Admin & Show Analytics Dashboard | *"Now switching to the Administrator portal. The dashboard displays real-time metrics computed directly from PostgreSQL: total complaints, open complaints, high-priority issues, average resolution time, and interactive Recharts visualizations showing category breakdown and intake trends. Admins can filter complaints, assign technicians like Chief Electrician Vikram Singh, and update the status with a confirmation modal."* |
| **4:30 - 5:30** | **Security & Cost Governance** | Show VPC / Subnets / Parameter Store / Budgets | *"Finally, our cloud security and cost controls: The RDS database is in private subnets with no public internet route, accessible only by EC2. All secrets are stored in Systems Manager Parameter Store. We deliberately eliminated expensive NAT Gateways to save $32/month, and configured an AWS Budget alarm at $10 with email alerts. Thank you, and we welcome your questions."* |

---

## 2. Frequently Asked Viva Questions & High-Scoring Answers

### Q1: Why did you choose Amazon EC2 instead of a 100% serverless architecture like AWS Lambda?
> **Answer**: Serverless Lambda functions are great for bursty event handlers, but an EC2-based architecture provides complete visibility into traditional compute infrastructure, custom VPC networking, operating system configuration, process management (PM2/systemd), and stateful background daemons. This demonstrates genuine systems engineering, networking, and security group administration required for a college Cloud Computing course.

### Q2: Why did you not use an AWS NAT Gateway in your VPC?
> **Answer**: An AWS NAT Gateway costs approximately **$32.40 per month** ($0.045/hour) plus data transfer charges, which is unsustainable for a student budget. By placing the EC2 instance in a public subnet with an Internet Gateway, EC2 can communicate outbound directly with AWS API endpoints (S3, SQS, SNS, CloudWatch). Meanwhile, our RDS database remains strictly in private subnets with no public IP, preserving 100% database security at zero additional cost.

### Q3: How do Amazon S3 Presigned URLs work, and why not upload through the Node.js server?
> **Answer**: A Presigned URL is an S3 REST API endpoint cryptographically signed with the EC2 instance's temporary IAM credentials, valid for a short window (e.g., 15 minutes). If image files were uploaded through Node.js, large file streams would consume server RAM and network bandwidth. Direct browser-to-S3 uploads offload heavy I/O to AWS S3 while maintaining private bucket security.

### Q4: How is the rule-based priority recommendation implemented, and why is it not machine learning?
> **Answer**: It is implemented using a transparent, deterministic expert system in `priorityRules.js`. It evaluates keyword matrices (e.g. 'spark', 'smoke', 'leak') and category heuristics. We deliberately did not use external AI APIs or claim it is machine learning because rule-based engines provide 100% deterministic, explainable results with zero third-party API latency and zero subscription cost.

### Q5: How does your background worker decouple complaints from notifications?
> **Answer**: When a complaint is created or modified, the backend writes to PostgreSQL and publishes a small JSON payload to Amazon SQS. The HTTP response is returned immediately to the user in ~30ms. An independent worker process on EC2 uses SQS long-polling to retrieve messages, sends the email notification via Amazon SNS, and deletes the message from SQS only when successful. If SNS or email delivery is temporarily slow, the student's submission is never delayed or lost.

### Q6: How are database credentials protected? Why are they not in source code?
> **Answer**: In production on EC2, sensitive parameters such as database passwords and JWT signing keys are stored in **AWS Systems Manager Parameter Store** as `SecureString` types encrypted with AWS KMS. The EC2 instance retrieves these values at runtime using its assigned IAM Instance Profile. No credentials or `.env` files are committed to Git.
