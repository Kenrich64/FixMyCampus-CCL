# FixMyCampus — Three-Person Team Project Contribution Plan

This document outlines the clear division of technical responsibilities across the three project team members for the Cloud Computing practical assessment and viva examination.

---

## Member 1 — Frontend Architecture & User Experience

**Core Focus**: Client-side application, design system, interactive analytics, and form validations.

### Primary Responsibilities & Completed Deliverables:
1. **Design System & Responsive Layout**:
   * Designed the Apple/SaaS-inspired visual system in [`client/src/index.css`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/client/src/index.css) utilizing CSS tokens, responsive grids, and clean cards.
   * Built the sticky [`Navbar.jsx`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/client/src/components/Navbar.jsx) and architecture-aware [`Footer.jsx`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/client/src/components/Footer.jsx).
2. **Student & Admin Portals**:
   * Developed 10 responsive pages including [`StudentDashboardPage.jsx`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/client/src/pages/StudentDashboardPage.jsx) and [`AdminDashboardPage.jsx`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/client/src/pages/AdminDashboardPage.jsx).
   * Built interactive Recharts data visualizations (category distribution bar chart and 14-day intake volume area chart).
3. **Interactive Features & Component Hierarchy**:
   * Built the real-time rule recommendation feedback panel in [`NewComplaintPage.jsx`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/client/src/pages/NewComplaintPage.jsx).
   * Implemented the chronological audit [`Timeline.jsx`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/client/src/components/Timeline.jsx) and [`ConfirmModal.jsx`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/client/src/components/ConfirmModal.jsx).
4. **Client-Side S3 Direct Upload Flow**:
   * Implemented direct browser-to-S3 file uploads in [`api.js`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/client/src/services/api.js) via presigned PUT URLs, offloading upload bandwidth from the application server.

---

## Member 2 — Backend REST API & Database Engineering

**Core Focus**: Server architecture, PostgreSQL schema design, transactions, authentication security, and test automation.

### Primary Responsibilities & Completed Deliverables:
1. **Relational Database Design**:
   * Designed the PostgreSQL schema in [`001_initial_schema.sql`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/server/migrations/001_initial_schema.sql) with tables `users`, `complaints`, and `complaint_history`.
   * Enforced sequential reference generation (`FC-YYYY-XXXX`) via `complaint_ref_seq`.
   * Implemented automated database migration ([`migrate.js`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/server/src/config/migrate.js)) and sample seeding ([`seed.js`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/server/src/config/seed.js)).
2. **Authentication & RBAC Middleware**:
   * Implemented bcrypt salted password hashing and JWT token management in [`authController.js`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/server/src/controllers/authController.js).
   * Built role-based access control middleware [`auth.js`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/server/src/middleware/auth.js) that strictly restricts student visibility to their own records.
3. **Complaint Workflow & Rule Engine**:
   * Created [`priorityRules.js`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/server/src/services/priorityRules.js) deterministic expert system for priority categorization.
   * Engineered atomic PostgreSQL transaction wrappers (`withTransaction`) for simultaneous complaint updates and history logging in [`complaintController.js`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/server/src/controllers/complaintController.js).
4. **Automated Testing Suite**:
   * Authored automated unit test suites in `server/tests/` verifying priority rules, authentication boundaries, and cloud resilience.

---

## Member 3 — AWS Cloud Architecture, Networking & Asynchronous Services

**Core Focus**: Cloud infrastructure, VPC networking, IAM security, asynchronous SQS/SNS queueing, monitoring, and cost governance.

### Primary Responsibilities & Completed Deliverables:
1. **Network Design & Security Groups**:
   * Architected the custom Amazon VPC (`10.0.0.0/16`), public subnet for EC2, and isolated dual private subnets for Amazon RDS.
   * Configured security groups (`fixmycampus-ec2-sg` and `fixmycampus-rds-sg`) ensuring PostgreSQL port 5432 is strictly accessible from EC2.
   * Eliminated costly NAT Gateways to save ~$32/month.
2. **IAM Least-Privilege & Parameter Store**:
   * Authored least-privilege IAM policies in [`ec2-instance-policy.json`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/infrastructure/iam/ec2-instance-policy.json) and [`trust-policy.json`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/infrastructure/iam/trust-policy.json).
   * Configured AWS Systems Manager Parameter Store for KMS-encrypted `SecureString` storage of database credentials.
3. **Asynchronous SQS/SNS Worker**:
   * Built the asynchronous notification publisher in [`sqsService.js`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/server/src/services/sqsService.js) and SNS broadcaster in [`snsService.js`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/server/src/services/snsService.js).
   * Engineered the long-polling background worker daemon in [`notificationWorker.js`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/server/src/workers/notificationWorker.js) with retry logic and graceful shutdown.
4. **Monitoring, Budgets & Documentation**:
   * Integrated Amazon CloudWatch Logs with automated secret redaction in [`cloudwatchService.js`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/server/src/services/cloudwatchService.js).
   * Documented cost management and budget alarms in [`cost-estimate.md`](file:///C:/Users/Kenrich/.gemini/antigravity-ide/scratch/fixmycampus/docs/cost-estimate.md).
