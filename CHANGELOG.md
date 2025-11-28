# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-XX

### Phase 1: Scaffold & Core Plumbing

#### Added

**Frontend (React + Vite + TypeScript + TailwindCSS)**
- Project scaffolding with Vite and TypeScript
- TailwindCSS configuration with custom primary color palette
- Firebase Web SDK integration for Auth and Firestore
- Authentication context with full auth state management
- Login page with email/password and Google SSO
- Registration page with role selection (student/teacher)
- Dashboard page with role-based content
- Protected route components
- Responsive navigation layout with user menu
- Vitest testing setup

**Backend (Node.js + Express + TypeScript)**
- Express server with TypeScript configuration
- Firebase Admin SDK integration
- Health check endpoints (`/api/health`, `/api/health/ready`)
- Auth routes with token verification
- JWT authentication middleware
- Role-based access control middleware
- Global error handling middleware
- Jest testing setup with Supertest

**Infrastructure**
- Monorepo structure with frontend/backend separation
- Environment variable templates (`.env.example`)
- README with setup instructions
- This CHANGELOG file

#### Security
- Helmet.js for HTTP security headers
- CORS configuration
- Firebase ID token verification
- Protected route middleware

### Notes
- Firebase Storage and Cloud Functions are NOT used (free tier compliance)
- File storage uses local file system mock (to be implemented in Phase 3)
- AI integration uses Groq only (OpenAI excluded per user request)

---

## [0.2.0] - 2024-01-XX

### Phase 2: Core Data Model & APIs

#### Added

**Data Models (`backend/src/types/index.ts`)**
- `User` - User profile with roles (student, teacher, admin)
- `Submission` - Student assignment submissions with versioning
- `SubmissionVersion` - Version history for submissions
- `Rubric` - Teacher-created evaluation rubrics with weighted criteria
- `RubricCriterion` - Individual rubric criteria with scores
- `Evaluation` - Assignment evaluations (teacher or AI)
- `CriterionScore` - Individual criterion scores with feedback
- API response types and pagination interfaces

**Submissions API (`/api/submissions`)**
- `GET /` - List submissions (role-filtered)
- `GET /:id` - Get single submission
- `POST /` - Create new submission (students only)
- `PUT /:id` - Update submission
- `POST /:id/submit` - Submit for review
- `DELETE /:id` - Delete draft submission
- `GET /:id/versions` - Get version history

**Rubrics API (`/api/rubrics`)**
- `GET /` - List rubrics (public for students)
- `GET /my` - Get teacher's own rubrics
- `GET /:id` - Get single rubric
- `POST /` - Create rubric (teachers only)
- `PUT /:id` - Update rubric
- `DELETE /:id` - Delete rubric

**Evaluations API (`/api/evaluations`)**
- `GET /` - List evaluations (role-filtered)
- `GET /:id` - Get single evaluation
- `GET /submission/:submissionId` - Get evaluations for submission
- `POST /` - Start evaluation (teachers only)
- `PUT /:id` - Update evaluation
- `POST /:id/complete` - Complete evaluation

**Documentation**
- Full API documentation in `docs/api.md`
- Firestore security rules in `firestore.rules`

**Tests**
- Submissions route tests (4 tests)
- Rubrics route tests (5 tests)
- Total: 13 passing tests

#### Security
- Role-based access control on all endpoints
- Students can only access their own submissions
- Teachers can only modify their own rubrics
- Comprehensive Firestore security rules

---

## [0.3.0] - 2024-01-XX

### Phase 3: Minimal UI + File Upload

#### Added

**Backend - File Upload**
- File upload API with multer (`/api/upload`)
- Local file storage in `uploads/` directory
- File type validation (PDF, DOC, DOCX, TXT, JPG, PNG, GIF)
- 10MB file size limit
- Static file serving for uploaded files

**Frontend - UI Components**
- Reusable UI component library:
  - `Button` - Primary, secondary, danger, ghost variants
  - `Card` - Container with header, title, description
  - `Input` - Form input with label and error states
  - `Textarea` - Multi-line text input
  - `Badge` - Status indicators with variants
  - `FileUpload` - Drag & drop file upload with preview

**Frontend - API Service Layer**
- Centralized API service (`services/api.ts`)
- Type-safe API functions for submissions, rubrics, evaluations
- Automatic Firebase auth token injection
- File upload support with FormData

**Student Pages**
- `SubmissionsList` - View all submissions with status badges
- `SubmissionForm` - Create/edit submissions with file upload
- `SubmissionDetail` - View submission with evaluation results

**Teacher Pages**
- `TeacherDashboard` - Overview with pending reviews count
- `ReviewSubmission` - Evaluate submissions with feedback form
- `RubricsList` - Manage evaluation rubrics
- `RubricForm` - Create/edit rubrics with criteria builder

**Routing**
- Student routes: `/submissions`, `/submissions/new`, `/submissions/:id`
- Teacher routes: `/teacher`, `/review/:id`, `/rubrics`, `/rubrics/new`
- Role-based navigation in Layout component

#### Changed
- Updated Layout with role-specific navigation links
- Dashboard now redirects based on user role

---

## [0.4.0] - 2024-01-XX

### Phase 4: AI Integrations

#### Added

**Backend - AI Service (`services/ai.ts`)**
- Groq API integration using Llama 3.1 models
- Grammar and spelling analysis
- Clarity and readability analysis
- Structure and organization analysis
- Content quality evaluation
- Overall feedback generation with actionable suggestions
- Automatic scoring algorithm based on text metrics
- Fallback messaging ensures graceful degradation when Groq is unavailable

**Backend - AI Routes (`routes/ai.ts`)**
- `POST /api/ai/evaluate/:submissionId` - Trigger full AI evaluation
- `GET /api/ai/status/:evaluationId` - Check evaluation status
- `POST /api/ai/quick-feedback` - Get quick feedback without saving

**Frontend - AI Integration**
- "Get AI Feedback" button on submission detail page
- Real-time status polling during AI evaluation
- AI evaluation results display with:
  - Grammar feedback
  - Clarity feedback
  - Structure feedback
  - Content feedback
  - Overall feedback
  - Suggestions for improvement
  - Score with percentage
- Teacher review page shows AI analysis as reference
- Teachers can request AI analysis before manual review

#### Technical Details
- Parallel API calls for faster evaluation
- Graceful error handling with fallback responses
- Text truncation for API limits (2000 chars per analysis)
- Async evaluation with status polling (30 second timeout)
- Purple-themed UI for AI features

---

## [0.5.0] - 2024-01-XX

### Phase 6: Quality, Tests, CI & Deployment

#### Added

**Backend Tests**
- AI routes tests (3 tests)
- Evaluations routes tests (3 tests)
- Total: 19 backend tests passing

**Frontend Tests**
- Button component tests (7 tests)
- Badge component tests (11 tests)
- Card component tests (6 tests)

**CI/CD**
- GitHub Actions workflow (`.github/workflows/ci.yml`)
  - Backend tests job
  - Frontend tests job
  - TypeScript type checking job
- Runs on push/PR to main/master branches

**Code Quality**
- ESLint configuration (`.eslintrc.json`)
- Prettier configuration (`.prettierrc`)

**Documentation**
- Updated README with all API endpoints
- Marked all phases as complete
- Added comprehensive endpoint documentation
