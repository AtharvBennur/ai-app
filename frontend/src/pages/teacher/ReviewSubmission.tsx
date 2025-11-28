import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { submissionsApi, evaluationsApi, aiApi, Submission, Evaluation } from '../../services/api'
import { Card, CardHeader, CardTitle, CardDescription, Button, Textarea, Badge, getStatusBadgeVariant, getStatusLabel } from '../../components/ui'

export default function ReviewSubmission() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestingAI, setRequestingAI] = useState(false)
  const [aiEvaluation, setAiEvaluation] = useState<Evaluation | null>(null)

  // Feedback fields
  const [grammarFeedback, setGrammarFeedback] = useState('')
  const [clarityFeedback, setClarityFeedback] = useState('')
  const [structureFeedback, setStructureFeedback] = useState('')
  const [contentFeedback, setContentFeedback] = useState('')
  const [overallFeedback, setOverallFeedback] = useState('')
  const [totalScore, setTotalScore] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      const subResponse = await submissionsApi.get(id!)

      if (subResponse.success) {
        setSubmission(subResponse.data)

        // Check for existing evaluation
        const evalResponse = await evaluationsApi.getForSubmission(id!)
        if (evalResponse.success && evalResponse.data.length > 0) {
          const existingEval = evalResponse.data.find((e: Evaluation) => e.evaluatorType === 'teacher')
          if (existingEval) {
            setEvaluation(existingEval)
            setGrammarFeedback(existingEval.grammarFeedback || '')
            setClarityFeedback(existingEval.clarityFeedback || '')
            setStructureFeedback(existingEval.structureFeedback || '')
            setContentFeedback(existingEval.contentFeedback || '')
            setOverallFeedback(existingEval.overallFeedback || '')
            setTotalScore(existingEval.totalScore?.toString() || '')
          }
          // Check for AI evaluation
          const aiEval = evalResponse.data.find((e: Evaluation) => e.evaluatorType === 'ai' && e.status === 'completed')
          if (aiEval) {
            setAiEvaluation(aiEval)
          }
        }
      } else {
        setError(subResponse.error || 'Failed to load submission')
      }
    } catch (err) {
      setError('Failed to load submission')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function startEvaluation() {
    try {
      setSaving(true)
      const response = await evaluationsApi.create({
        submissionId: id!,
        evaluatorType: 'teacher',
      })

      if (response.success) {
        setEvaluation(response.data)
      } else {
        setError(response.error || 'Failed to start evaluation')
      }
    } catch (err) {
      setError('Failed to start evaluation')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function saveFeedback() {
    if (!evaluation) return

    try {
      setSaving(true)
      const response = await evaluationsApi.update(evaluation.id, {
        status: 'in_progress',
        grammarFeedback,
        clarityFeedback,
        structureFeedback,
        contentFeedback,
        overallFeedback,
        totalScore: totalScore ? parseInt(totalScore, 10) : undefined,
      })

      if (!response.success) {
        setError(response.error || 'Failed to save feedback')
      }
    } catch (err) {
      setError('Failed to save feedback')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function completeEvaluation() {
    if (!evaluation) return

    if (!overallFeedback.trim()) {
      setError('Please provide overall feedback before completing the evaluation')
      return
    }

    try {
      setSaving(true)

      // First save the feedback
      await evaluationsApi.update(evaluation.id, {
        grammarFeedback,
        clarityFeedback,
        structureFeedback,
        contentFeedback,
        overallFeedback,
        totalScore: totalScore ? parseInt(totalScore, 10) : undefined,
      })

      // Then complete the evaluation
      const response = await evaluationsApi.complete(evaluation.id, overallFeedback)

      if (response.success) {
        navigate('/dashboard')
      } else {
        setError(response.error || 'Failed to complete evaluation')
      }
    } catch (err) {
      setError('Failed to complete evaluation')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error && !submission) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </Card>
    )
  }

  if (!submission) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Review: {submission.title}</h1>
            <Badge variant={getStatusBadgeVariant(submission.status)}>
              {getStatusLabel(submission.status)}
            </Badge>
          </div>
          <p className="mt-1 text-gray-500">
            By {submission.studentName} • Submitted {new Date(submission.submittedAt || submission.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          Back
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Content */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Content</CardTitle>
            <CardDescription>Version {submission.currentVersion}</CardDescription>
          </CardHeader>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg text-sm max-h-[500px] overflow-y-auto">
              {submission.content}
            </pre>
          </div>
          {submission.fileName && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Attachment:</p>
              <a
                href={`http://localhost:5000${submission.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {submission.fileName}
              </a>
            </div>
          )}
        </Card>

        {/* AI Evaluation Results (if available) */}
        {aiEvaluation && (
          <Card className="lg:col-span-2 bg-purple-50 border-purple-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <CardTitle className="text-purple-900">AI Analysis</CardTitle>
              </div>
              <CardDescription>Use this as a reference for your evaluation</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {aiEvaluation.grammarFeedback && (
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-1">Grammar</h4>
                  <p className="text-gray-600">{aiEvaluation.grammarFeedback}</p>
                </div>
              )}
              {aiEvaluation.clarityFeedback && (
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-1">Clarity</h4>
                  <p className="text-gray-600">{aiEvaluation.clarityFeedback}</p>
                </div>
              )}
              {aiEvaluation.structureFeedback && (
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-1">Structure</h4>
                  <p className="text-gray-600">{aiEvaluation.structureFeedback}</p>
                </div>
              )}
              {aiEvaluation.contentFeedback && (
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-1">Content</h4>
                  <p className="text-gray-600">{aiEvaluation.contentFeedback}</p>
                </div>
              )}
            </div>
            {aiEvaluation.totalScore !== undefined && (
              <div className="mt-4 pt-4 border-t border-purple-200">
                <p className="text-purple-900">
                  <span className="font-medium">AI Score:</span> {aiEvaluation.totalScore}/{aiEvaluation.maxPossibleScore} ({aiEvaluation.percentageScore?.toFixed(1)}%)
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Request AI Analysis Button */}
        {!aiEvaluation && !evaluation && (
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">AI Analysis</h3>
                <p className="text-sm text-gray-500">Get AI-powered feedback to assist your review</p>
              </div>
              <Button
                onClick={async () => {
                  setRequestingAI(true)
                  try {
                    const response = await aiApi.evaluateSubmission(id!)
                    if (response.success) {
                      // Poll for completion
                      const evalId = response.data.evaluationId
                      const poll = setInterval(async () => {
                        const status = await aiApi.checkStatus(evalId)
                        if (status.data?.status === 'completed') {
                          clearInterval(poll)
                          loadData()
                        }
                      }, 2000)
                      setTimeout(() => clearInterval(poll), 60000)
                    }
                  } finally {
                    setRequestingAI(false)
                  }
                }}
                isLoading={requestingAI}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Get AI Analysis
              </Button>
            </div>
          </Card>
        )}

        {/* Evaluation Form */}
        <div className="space-y-6">
          {!evaluation ? (
            <Card>
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start Evaluation</h3>
                <p className="text-gray-500 mb-4">Begin reviewing this submission</p>
                <Button onClick={startEvaluation} isLoading={saving}>
                  Start Evaluation
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Feedback</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  <Textarea
                    label="Grammar Feedback"
                    value={grammarFeedback}
                    onChange={(e) => setGrammarFeedback(e.target.value)}
                    placeholder="Comments on grammar, spelling, punctuation..."
                    rows={3}
                  />
                  <Textarea
                    label="Clarity Feedback"
                    value={clarityFeedback}
                    onChange={(e) => setClarityFeedback(e.target.value)}
                    placeholder="Comments on clarity and readability..."
                    rows={3}
                  />
                  <Textarea
                    label="Structure Feedback"
                    value={structureFeedback}
                    onChange={(e) => setStructureFeedback(e.target.value)}
                    placeholder="Comments on organization and flow..."
                    rows={3}
                  />
                  <Textarea
                    label="Content Feedback"
                    value={contentFeedback}
                    onChange={(e) => setContentFeedback(e.target.value)}
                    placeholder="Comments on content quality and depth..."
                    rows={3}
                  />
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Overall Assessment</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Score (optional)
                    </label>
                    <input
                      type="number"
                      value={totalScore}
                      onChange={(e) => setTotalScore(e.target.value)}
                      placeholder="0-100"
                      min="0"
                      max="100"
                      className="block w-32 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <Textarea
                    label="Overall Feedback"
                    value={overallFeedback}
                    onChange={(e) => setOverallFeedback(e.target.value)}
                    placeholder="Summarize your evaluation and provide final comments..."
                    rows={4}
                    required
                  />
                </div>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={saveFeedback}
                  isLoading={saving}
                >
                  Save Draft
                </Button>
                <Button
                  onClick={completeEvaluation}
                  isLoading={saving}
                >
                  Complete Evaluation
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
