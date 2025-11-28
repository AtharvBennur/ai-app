import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { submissionsApi, Submission } from '../../services/api'
import { Card, CardHeader, CardTitle, Button, Badge, getStatusBadgeVariant, getStatusLabel } from '../../components/ui'

export default function TeacherDashboard() {
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSubmissions()
  }, [])

  async function loadSubmissions() {
    try {
      setLoading(true)
      // Get submitted and under_review submissions
      const response = await submissionsApi.list({ status: 'submitted' })
      if (response.success) {
        setPendingSubmissions(response.data)
      } else {
        setError(response.error || 'Failed to load submissions')
      }
    } catch (err) {
      setError('Failed to load submissions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <Link to="/rubrics/new">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Rubric
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingSubmissions.length}</p>
              <p className="text-sm text-gray-500">Pending Reviews</p>
            </div>
          </div>
        </Card>
        <Card>
          <Link to="/rubrics" className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">My Rubrics</p>
              <p className="text-sm text-gray-500">Manage evaluation rubrics</p>
            </div>
          </Link>
        </Card>
        <Card>
          <Link to="/submissions" className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">All Submissions</p>
              <p className="text-sm text-gray-500">View all student work</p>
            </div>
          </Link>
        </Card>
      </div>

      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
        </CardHeader>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {pendingSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="mt-2 text-gray-500">No submissions waiting for review.</p>
          </div>
        ) : (
          <div className="divide-y">
            {pendingSubmissions.map((submission) => (
              <Link
                key={submission.id}
                to={`/review/${submission.id}`}
                className="block py-4 hover:bg-gray-50 -mx-6 px-6 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{submission.title}</h3>
                      <Badge variant={getStatusBadgeVariant(submission.status)}>
                        {getStatusLabel(submission.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      By {submission.studentName} • Submitted {new Date(submission.submittedAt || submission.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm">Review</Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
