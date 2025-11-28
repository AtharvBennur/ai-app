import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'

// Student pages
import SubmissionsList from './pages/student/SubmissionsList'
import SubmissionForm from './pages/student/SubmissionForm'
import SubmissionDetail from './pages/student/SubmissionDetail'

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import ReviewSubmission from './pages/teacher/ReviewSubmission'
import RubricsList from './pages/teacher/RubricsList'
import RubricForm from './pages/teacher/RubricForm'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return currentUser ? <Navigate to="/dashboard" /> : <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/submissions"
        element={
          <PrivateRoute>
            <Layout>
              <SubmissionsList />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/submissions/new"
        element={
          <PrivateRoute>
            <Layout>
              <SubmissionForm />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/submissions/:id"
        element={
          <PrivateRoute>
            <Layout>
              <SubmissionDetail />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/submissions/:id/edit"
        element={
          <PrivateRoute>
            <Layout>
              <SubmissionForm />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacher"
        element={
          <PrivateRoute>
            <Layout>
              <TeacherDashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/review/:id"
        element={
          <PrivateRoute>
            <Layout>
              <ReviewSubmission />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/rubrics"
        element={
          <PrivateRoute>
            <Layout>
              <RubricsList />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/rubrics/new"
        element={
          <PrivateRoute>
            <Layout>
              <RubricForm />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/rubrics/:id/edit"
        element={
          <PrivateRoute>
            <Layout>
              <RubricForm />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
