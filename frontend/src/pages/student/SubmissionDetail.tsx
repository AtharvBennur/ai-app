import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { submissionsApi, evaluationsApi, aiApi, Submission, Evaluation } from '../../services/api'
import { Card, CardHeader, CardTitle, CardDescription, Button, Badge, getStatusBadgeVariant, getStatusLabel } from '../../components/ui'

export default function SubmissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [requestingAI, setRequestingAI] = useState(false)
  const [aiStatus, setAiStatus] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      const [subResponse, evalResponse] = await Promise.all([
        submissionsApi.get(id!),
        evaluationsApi.getForSubmission(id!),
      ])

      if (subResponse.success) {
        setSubmission(subResponse.data)
      } else {
        setError(subResponse.error || 'Failed to load submission')
      }

      if (evalResponse.success) {
        setEvaluations(evalResponse.data)
      }
    } catch (err) {
      setError('Failed to load submission')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this submission?')) return

    try {
      setDeleting(true)
      const response = await submissionsApi.delete(id!)
      if (response.success) {
        navigate('/submissions')
      } else {
        setError(response.error || 'Failed to delete submission')
      }
    } catch (err) {
      setError('Failed to delete submission')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error || 'Submission not found'}</p>
          <Button onClick={() => navigate('/submissions')}>Back to Submissions</Button>
        </div>
      </Card>
    )
  }

  const canEdit = submission.status === 'draft' || submission.status === 'returned'
  const completedEvaluation = evaluations.find(e => e.status === 'completed')
  const pendingAIEvaluation = evaluations.find(e => e.evaluatorType === 'ai' && e.status !== 'completed')
  const canRequestAI = submission.status === 'submitted' && !pendingAIEvaluation && !completedEvaluation

  async function handleRequestAI() {
    try {
      setRequestingAI(true)
      setAiStatus('Starting AI evaluation...')
      const response = await aiApi.evaluateSubmission(id!)
      
      if (response.success) {
        setAiStatus('AI evaluation in progress. This may take a minute...')
        // Poll for completion
        const evaluationId = response.data.evaluationId
        let attempts = 0
        const maxAttempts = 30 // 30 seconds max
        
        const pollInterval = setInterval(async () => {
          attempts++
          try {
            const statusResponse = await aiApi.checkStatus(evaluationId)
            if (statusResponse.success && statusResponse.data.status === 'completed') {
              clearInterval(pollInterval)
              setAiStatus(null)
              loadData() // Reload to show results
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval)
              setAiStatus('Evaluation is taking longer than expected. Please refresh the page.')
            }
          } catch (err) {
            console.error('Status check error:', err)
          }
        }, 1000)
      } else {
        setAiStatus(null)
        setError(response.error || 'Failed to start AI evaluation')
      }
    } catch (err) {
      setAiStatus(null)
      setError('Failed to request AI evaluation')
      console.error(err)
    } finally {
      setRequestingAI(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{submission.title}</h1>
            <Badge variant={getStatusBadgeVariant(submission.status)}>
              {getStatusLabel(submission.status)}
            </Badge>
          </div>
          {submission.description && (
            <p className="mt-1 text-gray-500">{submission.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {canRequestAI && (
            <Button
              onClick={handleRequestAI}
              isLoading={requestingAI}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Get AI Feedback
            </Button>
          )}
          {canEdit && (
            <>
              <Link to={`/submissions/${id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={deleting}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* AI Status Banner */}
      {aiStatus && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
          <p className="text-purple-700">{aiStatus}</p>
        </div>
      )}

      {/* Pending AI Evaluation */}
      {pendingAIEvaluation && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
          <p className="text-yellow-700">AI evaluation is in progress...</p>
        </div>
      )}

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>Version {submission.currentVersion}</CardDescription>
        </CardHeader>
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg">
            {submission.content}
          </pre>
        </div>
      </Card>

      {/* Attachment */}
      {submission.fileName && (
        <Card>
          <CardHeader>
            <CardTitle>Attachment</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">{submission.fileName}</p>
              {submission.fileUrl && (
                <a
                  href={`http://localhost:5000${submission.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:underline"
                >
                  Download file
                </a>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Evaluation Results */}
      {completedEvaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Results</CardTitle>
            <CardDescription>
              Evaluated by {completedEvaluation.evaluatorType === 'ai' ? 'AI' : 'Teacher'}
            </CardDescription>
          </CardHeader>

          {completedEvaluation.totalScore !== undefined && (
            <div className="mb-6 p-4 bg-primary-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-primary-600 font-medium">Total Score</p>
                <p className="text-3xl font-bold text-primary-700">
                  {completedEvaluation.totalScore}
                  {completedEvaluation.maxPossibleScore && (
                    <span className="text-lg font-normal text-primary-500">
                      /{completedEvaluation.maxPossibleScore}
                    </span>
                  )}
                </p>
                {completedEvaluation.percentageScore !== undefined && (
                  <p className="text-sm text-primary-600">
                    {completedEvaluation.percentageScore.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Feedback sections */}
          <div className="space-y-4">
            {completedEvaluation.grammarFeedback && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Grammar</h4>
                <p className="text-gray-600 text-sm">{completedEvaluation.grammarFeedback}</p>
              </div>
            )}
            {completedEvaluation.clarityFeedback && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Clarity</h4>
                <p className="text-gray-600 text-sm">{completedEvaluation.clarityFeedback}</p>
              </div>
            )}
            {completedEvaluation.structureFeedback && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Structure</h4>
                <p className="text-gray-600 text-sm">{completedEvaluation.structureFeedback}</p>
              </div>
            )}
            {completedEvaluation.contentFeedback && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Content</h4>
                <p className="text-gray-600 text-sm">{completedEvaluation.contentFeedback}</p>
              </div>
            )}
            {completedEvaluation.overallFeedback && (
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-1">Overall Feedback</h4>
                <p className="text-gray-600">{completedEvaluation.overallFeedback}</p>
              </div>
            )}
            {completedEvaluation.suggestions && completedEvaluation.suggestions.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Suggestions for Improvement</h4>
                <ul className="list-disc list-inside space-y-1">
                  {completedEvaluation.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-gray-600 text-sm">{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium">{new Date(submission.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Updated</p>
            <p className="font-medium">{new Date(submission.updatedAt).toLocaleString()}</p>
          </div>
          {submission.submittedAt && (
            <div>
              <p className="text-gray-500">Submitted</p>
              <p className="font-medium">{new Date(submission.submittedAt).toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Version</p>
            <p className="font-medium">{submission.currentVersion}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
