# FixMyCampus — REST API Documentation

Base URL: `http://<EC2-HOST>:5000/api`

All authenticated endpoints require an `Authorization: Bearer <jwt_token>` header.

---

## 1. Authentication Endpoints

### 1.1 Register Student
* **Endpoint**: `POST /api/auth/register`
* **Access**: Public (Strictly registers role `student`; admin role creation is disallowed)
* **Request Body**:
```json
{
  "name": "Arjun Verma",
  "email": "student@fixmycampus.edu",
  "password": "StudentPass123!"
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "Arjun Verma",
    "email": "student@fixmycampus.edu",
    "role": "student"
  }
}
```

### 1.2 Login
* **Endpoint**: `POST /api/auth/login`
* **Access**: Public (Protected by rate limiting: 30 attempts / 15 min per IP)
* **Request Body**:
```json
{
  "email": "admin@fixmycampus.edu",
  "password": "AdminSecureCampus2026!"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Dr. Sarah Jenkins",
    "email": "admin@fixmycampus.edu",
    "role": "admin"
  }
}
```
* **Error Response (401 Unauthorized)**:
```json
{
  "success": false,
  "error": "Invalid email or password."
}
```

### 1.3 Get Current User Profile
* **Endpoint**: `GET /api/auth/me`
* **Access**: Authenticated

---

## 2. Complaint Endpoints

### 2.1 Live Priority Recommendation (Rule-Based Preview)
* **Endpoint**: `POST /api/complaints/recommend-priority`
* **Access**: Authenticated
* **Request Body**:
```json
{
  "category": "Electrical problems",
  "title": "Sparking outlet",
  "description": "Exposed wire sparking near physics bench."
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "recommendedPriority": "urgent",
  "reason": "Immediate safety or structural hazard detected (spark, exposed wire). Requires immediate dispatch.",
  "matchedRules": [
    "Detected critical hazard keywords: \"spark\", \"exposed wire\""
  ]
}
```

### 2.2 Submit Complaint
* **Endpoint**: `POST /api/complaints`
* **Access**: Authenticated (Student or Admin)
* **Request Body**:
```json
{
  "title": "Air Conditioner not cooling in Seminar Hall 3",
  "description": "AC unit blows warm air during packed 100-student guest lecture sessions.",
  "category": "Classroom equipment",
  "location": "Academic Block A, Seminar Hall 3",
  "priority": "medium"
}
```
* **Response (201 Created)**: Returns saved complaint with generated reference number (e.g. `FC-2026-0006`).

### 2.3 List Complaints
* **Endpoint**: `GET /api/complaints`
* **Access**: Authenticated
  * **Students**: Automatically constrained to records where `student_id = req.user.id`.
  * **Admins**: Can view all complaints across campus with query filters:
    * `status`: `pending | in_progress | resolved | rejected`
    * `priority`: `low | medium | high | urgent`
    * `category`: One of 10 categories
    * `search`: Matches title, reference number, or location
    * `page`: Default 1
    * `limit`: Default 20

### 2.4 Get Complaint Details
* **Endpoint**: `GET /api/complaints/:id`
* **Access**: Authenticated (Student can only access their own; Admin can access any)
* **Response**: Returns complaint data, presigned S3 evidence URL (if image attached), and chronological history timeline.

### 2.5 Update Complaint Status
* **Endpoint**: `PATCH /api/complaints/:id/status`
* **Access**: Admin only
* **Request Body**:
```json
{
  "status": "resolved",
  "note": "Replaced faulty compressor sensor and tested 20C cooling output."
}
```

### 2.6 Update Complaint Priority
* **Endpoint**: `PATCH /api/complaints/:id/priority`
* **Access**: Admin only
* **Request Body**:
```json
{
  "priority": "urgent",
  "note": "Escalated due to impending university exam session."
}
```

### 2.7 Assign Maintenance Personnel
* **Endpoint**: `PATCH /api/complaints/:id/assign`
* **Access**: Admin only
* **Request Body**:
```json
{
  "assignedTo": "Vikram Singh (Chief Electrician)",
  "note": "Dispatched for urgent inspection."
}
```

### 2.8 Append Note
* **Endpoint**: `POST /api/complaints/:id/notes`
* **Access**: Admin only
* **Request Body**:
```json
{
  "note": "Spare parts ordered from authorized vendor; expected delivery tomorrow morning.",
  "isResolutionNote": false
}
```

---

## 3. Evidence Upload Endpoints (Amazon S3)

### 3.1 Request Presigned Upload URL
* **Endpoint**: `POST /api/uploads/presigned-url`
* **Access**: Authenticated
* **Request Body**:
```json
{
  "fileType": "image/jpeg",
  "fileSize": 1450200
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "uploadUrl": "https://fixmycampus-evidence-student.s3.us-east-1.amazonaws.com/evidence/student-2/1730000000000-abcd.jpg?AWSAccessKeyId=...",
  "s3Key": "evidence/student-2/1730000000000-abcd.jpg",
  "expiresIn": 900
}
```

### 3.2 Confirm Upload Integrity
* **Endpoint**: `POST /api/uploads/confirm`
* **Access**: Authenticated (Verifies ownership & S3 `HeadObject`)
* **Request Body**:
```json
{
  "complaintId": 5,
  "s3Key": "evidence/student-2/1730000000000-abcd.jpg"
}
```

---

## 4. Dashboard Endpoints

### 4.1 Student Dashboard
* **Endpoint**: `GET /api/dashboard/student`
* **Access**: Student role only

### 4.2 Administrator Dashboard Analytics
* **Endpoint**: `GET /api/dashboard/admin`
* **Access**: Admin role only
* **Response**: Returns total count, open count, high-priority count, resolved count, average resolution time, category distribution, and intake timeline trends.

---

## 5. System Health Check
* **Endpoint**: `GET /api/health`
* **Access**: Public
* **Response (200 OK)**:
```json
{
  "status": "healthy",
  "service": "FixMyCampus API Server",
  "uptimeSeconds": 1420,
  "timestamp": "2026-10-27T05:25:00.000Z",
  "environment": "production",
  "awsServicesEnabled": true,
  "database": "healthy"
}
```
