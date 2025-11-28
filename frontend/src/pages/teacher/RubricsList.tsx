import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { rubricsApi, Rubric } from '../../services/api'
import { Card, Button, Badge } from '../../components/ui'

export default function RubricsList() {
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRubrics()
  }, [])

  async function loadRubrics() {
    try {
      setLoading(true)
      const response = await rubricsApi.getMyRubrics()
      if (response.success) {
        setRubrics(response.data)
      } else {
        setError(response.error || 'Failed to load rubrics')
      }
    } catch (err) {
      setError('Failed to load rubrics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this rubric?')) return

    try {
      const response = await rubricsApi.delete(id)
      if (response.success) {
        setRubrics(rubrics.filter(r => r.id !== id))
      } else {
        setError(response.error || 'Failed to delete rubric')
      }
    } catch (err) {
      setError('Failed to delete rubric')
      console.error(err)
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
        <h1 className="text-2xl font-bold text-gray-900">My Rubrics</h1>
        <Link to="/rubrics/new">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Rubric
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {rubrics.length === 0 ? (
        <Card>
          <div className="text-center py-12">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No rubrics yet</h3>
            <p className="mt-2 text-gray-500">Create your first rubric to start evaluating assignments.</p>
            <div className="mt-6">
              <Link to="/rubrics/new">
                <Button>Create Rubric</Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rubrics.map((rubric) => (
            <Card key={rubric.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium text-gray-900">{rubric.title}</h3>
                    <Badge variant={rubric.isPublic ? 'success' : 'default'}>
                      {rubric.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  {rubric.description && (
                    <p className="mt-1 text-sm text-gray-500">{rubric.description}</p>
                  )}
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{rubric.criteria.length}</span> criteria •{' '}
                      <span className="font-medium">{rubric.maxTotalScore}</span> max points
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {rubric.criteria.map((criterion) => (
                        <span
                          key={criterion.id}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {criterion.name} ({criterion.weight}%)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link to={`/rubrics/${rubric.id}/edit`}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(rubric.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
