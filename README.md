# AI Assignment Evaluation System (ai-assign-eval)

An AI-powered web application that evaluates student assignments for grammar, clarity, structure, and content quality.

## 🏗️ Project Structure

```
ai-assign-eval/
├── frontend/          # React + Vite + TypeScript + TailwindCSS
├── backend/           # Node.js + Express + TypeScript
├── docs/              # API documentation
├── .env.example       # Environment variables template
├── CHANGELOG.md       # Project changelog
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project (free tier)
- Hugging Face API key

### 1. Clone and Install

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Configure Environment Variables

#### Frontend (`frontend/.env`)
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=your_project_id
HF_API_KEY=your_huggingface_api_key
AI_PROVIDER=huggingface
OCR_PROVIDER=hf_ocr
```

### 3. Run Development Servers

```bash
# Start both backend (API) and frontend (Vite) together
cd backend
npm run dev

# (Optional) Start them separately if needed
# Backend only: npm run dev:backend
# Frontend only: (from root) npm --prefix frontend run dev
```

- Frontend (auto-opens): http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Authentication

The app supports:
- **Email/Password** authentication
- **Google SSO** authentication

Users can register as either a **Student** or **Teacher**.

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** with Email/Password and Google providers
4. Enable **Firestore Database**
5. Copy your web app configuration to the frontend `.env` file

## 🧪 Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📁 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, TailwindCSS |
| Backend | Node.js, Express, TypeScript |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| AI | Hugging Face API |
| Storage | Local File System (MVP) |

## 🛣️ Development Phases

- [x] **Phase 1**: Scaffold & Core Plumbing (Auth, Firebase integration)
- [x] **Phase 2**: Core Data Model & APIs
- [x] **Phase 3**: Minimal UI + File Upload
- [x] **Phase 4**: AI Integrations
- [x] **Phase 6**: Quality, Tests, CI & Deployment

## 📝 API Endpoints

### Health Check
- `GET /api/health` - Server health status
- `GET /api/health/ready` - Readiness check with service status

### Authentication
- `GET /api/auth/check` - Verify auth routes are working
- `POST /api/auth/verify` - Verify Firebase ID token
- `GET /api/auth/me` - Get current user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Submissions
- `GET /api/submissions` - List submissions
- `POST /api/submissions` - Create submission
- `GET /api/submissions/:id` - Get submission
- `PUT /api/submissions/:id` - Update submission
- `POST /api/submissions/:id/submit` - Submit for review
- `DELETE /api/submissions/:id` - Delete submission

### Rubrics
- `GET /api/rubrics` - List rubrics
- `GET /api/rubrics/my` - Get teacher's rubrics
- `POST /api/rubrics` - Create rubric
- `PUT /api/rubrics/:id` - Update rubric
- `DELETE /api/rubrics/:id` - Delete rubric

### Evaluations
- `GET /api/evaluations` - List evaluations
- `POST /api/evaluations` - Start evaluation
- `PUT /api/evaluations/:id` - Update evaluation
- `POST /api/evaluations/:id/complete` - Complete evaluation

### AI
- `POST /api/ai/evaluate/:submissionId` - Trigger AI evaluation
- `GET /api/ai/status/:evaluationId` - Check evaluation status
- `POST /api/ai/quick-feedback` - Get quick AI feedback

### File Upload
- `POST /api/upload` - Upload file
- `DELETE /api/upload/:filename` - Delete file

## 🔒 Security

- Firebase ID token verification on protected routes
- Role-based access control (student, teacher, admin)
- Helmet.js for HTTP security headers
- CORS configured for frontend origin

## 📄 License

MIT
