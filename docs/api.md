# API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication
All protected endpoints require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

---

## Health Check

### GET /health
Check server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.678,
  "environment": "development"
}
```

### GET /health/ready
Check service readiness.

**Response:**
```json
{
  "status": "ready",
  "services": {
    "firebase": "configured",
    "ai": "configured"
  }
}
```

---

## Authentication

### POST /auth/verify
Verify a Firebase ID token and get user info.

**Request Body:**
```json
{
  "idToken": "firebase-id-token"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "user-id",
    "email": "user@example.com",
    "emailVerified": true,
    "profile": {
      "displayName": "John Doe",
      "role": "student"
    }
  }
}
```

### GET /auth/me
Get current user profile. **Requires authentication.**

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "student",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### PUT /auth/profile
Update user profile. **Requires authentication.**

**Request Body:**
```json
{
  "displayName": "New Name"
}
```

---

## Submissions

### GET /submissions
Get all submissions. **Requires authentication.**

- Students see only their own submissions
- Teachers/Admins see all submissions

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status: draft, submitted, under_review, evaluated, returned |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "submission-id",
      "studentId": "user-id",
      "studentName": "John Doe",
      "title": "My Assignment",
      "description": "Assignment description",
      "content": "Assignment content...",
      "status": "submitted",
      "currentVersion": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### GET /submissions/:id
Get a single submission. **Requires authentication.**

### POST /submissions
Create a new submission. **Requires authentication (Students only).**

**Request Body:**
```json
{
  "title": "My Assignment",
  "description": "Optional description",
  "content": "Assignment content...",
  "rubricId": "optional-rubric-id"
}
```

### PUT /submissions/:id
Update a submission. **Requires authentication (Owner only).**

- Students can only edit drafts or returned submissions
- Teachers can update any submission

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "status": "draft"
}
```

### POST /submissions/:id/submit
Submit an assignment for review. **Requires authentication (Owner only).**

Changes status from `draft` to `submitted`.

### DELETE /submissions/:id
Delete a submission. **Requires authentication (Owner only, drafts only).**

### GET /submissions/:id/versions
Get version history of a submission. **Requires authentication.**

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "version-id",
      "submissionId": "submission-id",
      "version": 2,
      "content": "Version 2 content...",
      "createdAt": "2024-01-02T00:00:00.000Z",
      "createdBy": "user-id"
    }
  ]
}
```

---

## Rubrics

### GET /rubrics
Get all rubrics. **Requires authentication.**

- Students see only public rubrics
- Teachers/Admins see all rubrics

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rubric-id",
      "teacherId": "teacher-id",
      "teacherName": "Prof. Smith",
      "title": "Essay Rubric",
      "description": "Rubric for evaluating essays",
      "criteria": [
        {
          "id": "criterion-id",
          "name": "Grammar",
          "description": "Correct grammar and spelling",
          "maxScore": 25,
          "weight": 25
        }
      ],
      "maxTotalScore": 100,
      "isPublic": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

### GET /rubrics/my
Get rubrics created by current teacher. **Requires authentication (Teachers only).**

### GET /rubrics/:id
Get a single rubric. **Requires authentication.**

### POST /rubrics
Create a new rubric. **Requires authentication (Teachers only).**

**Request Body:**
```json
{
  "title": "Essay Rubric",
  "description": "Rubric for evaluating essays",
  "criteria": [
    {
      "name": "Grammar",
      "description": "Correct grammar and spelling",
      "maxScore": 25,
      "weight": 25
    },
    {
      "name": "Content",
      "description": "Quality of content",
      "maxScore": 50,
      "weight": 50
    },
    {
      "name": "Structure",
      "description": "Organization and flow",
      "maxScore": 25,
      "weight": 25
    }
  ],
  "isPublic": true
}
```

**Note:** Criteria weights must sum to 100.

### PUT /rubrics/:id
Update a rubric. **Requires authentication (Owner only).**

### DELETE /rubrics/:id
Delete a rubric. **Requires authentication (Owner only).**

Cannot delete rubrics that are in use by submissions.

---

## Evaluations

### GET /evaluations
Get evaluations. **Requires authentication.**

- Students see only evaluations of their submissions
- Teachers/Admins see all evaluations

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| submissionId | string | Filter by submission |
| evaluatorType | string | Filter by type: teacher, ai |
| status | string | Filter by status: pending, in_progress, completed |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |

### GET /evaluations/:id
Get a single evaluation. **Requires authentication.**

### GET /evaluations/submission/:submissionId
Get all evaluations for a submission. **Requires authentication.**

### POST /evaluations
Start a new evaluation. **Requires authentication (Teachers only).**

**Request Body:**
```json
{
  "submissionId": "submission-id",
  "rubricId": "optional-rubric-id",
  "evaluatorType": "teacher"
}
```

### PUT /evaluations/:id
Update an evaluation. **Requires authentication (Evaluator only).**

**Request Body:**
```json
{
  "status": "in_progress",
  "criteriaScores": [
    {
      "criterionId": "criterion-id",
      "criterionName": "Grammar",
      "score": 20,
      "maxScore": 25,
      "feedback": "Good grammar with minor errors"
    }
  ],
  "totalScore": 85,
  "grammarFeedback": "Overall good grammar...",
  "clarityFeedback": "Clear and concise...",
  "structureFeedback": "Well organized...",
  "contentFeedback": "Strong arguments...",
  "overallFeedback": "Excellent work!",
  "suggestions": [
    "Consider adding more examples",
    "Proofread for minor typos"
  ]
}
```

### POST /evaluations/:id/complete
Mark an evaluation as complete. **Requires authentication (Evaluator only).**

**Request Body:**
```json
{
  "overallFeedback": "Final feedback message"
}
```

---

## Data Models

### User Roles
| Role | Description |
|------|-------------|
| student | Can create/submit assignments, view own evaluations |
| teacher | Can create rubrics, evaluate submissions |
| admin | Full access to all resources |

### Submission Status
| Status | Description |
|--------|-------------|
| draft | Initial state, can be edited |
| submitted | Submitted for review |
| under_review | Being evaluated |
| evaluated | Evaluation complete |
| returned | Returned for revision |

### Evaluation Status
| Status | Description |
|--------|-------------|
| pending | Evaluation created but not started |
| in_progress | Evaluation in progress |
| completed | Evaluation finished |

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

### Common HTTP Status Codes
| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |
