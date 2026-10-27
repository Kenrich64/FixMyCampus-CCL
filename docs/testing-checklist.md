# FixMyCampus — Quality Assurance & Testing Checklist

Use this checklist during local development, staging verification, and faculty demonstration.

---

## 1. Automated Test Execution

Run the built-in test suite:
```bash
npm test
```

### Verified Test Cases:
| Test ID | Test Name | Target Component | Status |
| :--- | :--- | :--- | :--- |
| **TC-01** | S3 rejects unapproved file extensions (.exe, .sh) | `s3Service.js` | **PASS (Verified)** |
| **TC-02** | S3 rejects files exceeding 5MB limit | `s3Service.js` | **PASS (Verified)** |
| **TC-03** | Server generates secure scoped S3 key | `s3Service.js` | **PASS (Verified)** |
| **TC-04** | SQS enqueues jobs without throwing fatal errors | `sqsService.js` | **PASS (Verified)** |
| **TC-05** | Structured logger sanitizes passwords and tokens | `cloudwatchService.js` | **PASS (Verified)** |
| **TC-06** | Priority engine flags bare wires & sparks as Urgent | `priorityRules.js` | **PASS (Verified)** |
| **TC-07** | Priority engine flags fire & smoke as Urgent | `priorityRules.js` | **PASS (Verified)** |
| **TC-08** | Priority engine flags lab equipment & blackouts as High | `priorityRules.js` | **PASS (Verified)** |
| **TC-09** | Priority engine flags classroom projectors as Medium | `priorityRules.js` | **PASS (Verified)** |
| **TC-10** | Priority engine flags cosmetic scratches as Low | `priorityRules.js` | **PASS (Verified)** |
| **TC-11** | Hashes passwords with bcrypt (salt rounds >= 10) | `authController.js` | **PASS (Verified)** |
| **TC-12** | Middleware rejects requests missing token (401) | `auth.js` | **PASS (Verified)** |
| **TC-13** | Middleware rejects invalid or tampered JWT (401) | `auth.js` | **PASS (Verified)** |
| **TC-14** | Valid token successfully attaches verified identity | `auth.js` | **PASS (Verified)** |
| **TC-15** | Blocks student from accessing admin endpoints (403) | `auth.js` (requireRole) | **PASS (Verified)** |
| **TC-16** | Permits administrator to access admin endpoints | `auth.js` (requireRole) | **PASS (Verified)** |

---

## 2. Manual End-to-End Verification Checklist

### Flow 1: Student Registration & Authentication
- [ ] 1. Open `http://localhost:5173/register` (or EC2 host).
- [ ] 2. Enter full name, campus email, password (min 6 chars), and confirmation.
- [ ] 3. Submit registration. Verify automatic redirect to `/dashboard`.
- [ ] 4. Log out and navigate to `/login`.
- [ ] 5. Enter an invalid password. Verify generic message: `"Invalid email or password."`.
- [ ] 6. Click **Student Demo** quick-fill button. Verify successful login.

### Flow 2: Smart Priority Rule Engine & Complaint Submission
- [ ] 1. Click **Report an Issue** (`/complaints/new`).
- [ ] 2. Type title: `"Exposed sparking wire in lab"` & select category: `"Electrical problems"`.
- [ ] 3. Observe the rule recommendation card automatically update to **URGENT** with transparent safety reasoning displayed.
- [ ] 4. Attach a sample image file (PNG/JPG under 5MB).
- [ ] 5. Click **Register Complaint**.
- [ ] 6. Verify complaint is created with unique reference code (e.g. `FC-2026-0006`).
- [ ] 7. Verify redirect to complaint detail view showing the evidence photograph and initial timeline event `"submitted"`.

### Flow 3: Security & Authorization Boundary Checks
- [ ] 1. Copy the URL of the created complaint (e.g. `/complaints/6`).
- [ ] 2. Log out and log in as another student (e.g. `priya.sharma@fixmycampus.edu`).
- [ ] 3. Try opening `/complaints/6`.
- [ ] 4. **Expected Result**: Denied with error `"Access denied: You cannot view this complaint."`.
- [ ] 5. As a student, try navigating directly to `/admin/dashboard`.
- [ ] 6. **Expected Result**: Automatically redirected to `/unauthorized` with friendly restricted access notice.

### Flow 4: Administrator Management & Triage
- [ ] 1. Log in as administrator (`admin@fixmycampus.edu` / `AdminSecureCampus2026!`).
- [ ] 2. Open `/admin/dashboard`. Verify total complaint count, category distribution chart, and trend chart reflect actual database numbers.
- [ ] 3. Navigate to `/admin/complaints`.
- [ ] 4. Filter by status: `Pending` and priority: `Urgent`.
- [ ] 5. Click **Triage & Assign** on a complaint.
- [ ] 6. Assign to `"Vikram Singh (Chief Electrician)"`. Verify confirmation message.
- [ ] 7. Update status to `"In Progress"`.
- [ ] 8. Update status to `"Resolved"`. Verify confirmation dialog appears asking for confirmation.
- [ ] 9. Enter resolution note: `"Replaced circuit breaker and tested voltage."`. Submit.
- [ ] 10. Verify complaint timeline displays the assigned technician, status progression diffs, and resolution note.

### Flow 5: Asynchronous Worker & SNS Notification Processing
- [ ] 1. In terminal, observe worker output (`npm run dev:worker` or `pm2 logs fixmycampus-worker`).
- [ ] 2. Verify worker consumes the SQS message and publishes the maintenance alert to the SNS topic.
- [ ] 3. Verify notification email arrives in the subscribed student/admin inbox.
- [ ] 4. Verify message is deleted from SQS only after successful SNS publish.
