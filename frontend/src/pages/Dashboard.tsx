import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { submissionsApi, evaluationsApi, rubricsApi, aiApi, Submission, Evaluation, Rubric } from '../services/api'
import { Badge, getStatusBadgeVariant, getStatusLabel } from '../components/ui'

interface AiFeedbackResult {
  summary: string
  wordCount: number
  insights: string[]
}

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [feedbackInput, setFeedbackInput] = useState('')
  const [feedbackResult, setFeedbackResult] = useState<AiFeedbackResult | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const role = userProfile?.role || 'student'

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      setLoading(true)
      setError(null)
      const [subRes, evalRes, rubricRes] = await Promise.all([
        submissionsApi.list(),
        evaluationsApi.list(),
        rubricsApi.list({ limit: 50 }),
      ])

      if (subRes.success) setSubmissions(subRes.data)
      if (evalRes.success) setEvaluations(evalRes.data)
      if (rubricRes.success) setRubrics(rubricRes.data)
    } catch (err) {
      console.error(err)
      setError('We had trouble loading your workspace. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const draft = submissions.filter((s) => s.status === 'draft').length
    const inReview = submissions.filter((s) => ['submitted', 'under_review'].includes(s.status)).length
    const completed = submissions.filter((s) => ['evaluated', 'returned'].includes(s.status)).length
    const aiReviews = evaluations.filter((e) => e.evaluatorType === 'ai').length
    const averageScore =
      evaluations.filter((e) => typeof e.percentageScore === 'number').reduce((acc, cur) => acc + (cur.percentageScore || 0), 0) /
      (evaluations.filter((e) => typeof e.percentageScore === 'number').length || 1)

    return {
      draft,
      inReview,
      completed,
      aiReviews,
      totalRubrics: rubrics.length,
      totalSubmissions: submissions.length,
      averageScore: Number.isFinite(averageScore) ? averageScore : undefined,
    }
  }, [submissions, evaluations, rubrics])

  const activity = useMemo(() => {
    return [...submissions]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [submissions])

  const featuredRubric = useMemo(() => {
    return [...rubrics].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
  }, [rubrics])

  async function handleQuickFeedback(event: React.FormEvent) {
    event.preventDefault()
    if (!feedbackInput.trim()) {
      setFeedbackError('Drop a paragraph or two first.')
      return
    }

    try {
      setFeedbackLoading(true)
      setFeedbackError(null)
      const response = await aiApi.getQuickFeedback(feedbackInput)
      if (response.success) {
        const payload = response.data as Partial<AiFeedbackResult> & { suggestions?: string[] }
        setFeedbackResult({
          summary: payload.summary || 'AI feedback generated.',
          wordCount: payload.wordCount || feedbackInput.trim().split(/\s+/).length,
          insights: payload.insights || payload.suggestions || ['Keep iterating—your structure is almost there.'],
        })
      } else {
        setFeedbackError(response.error || 'AI is busy—try again.')
      }
    } catch (err) {
      console.error(err)
      setFeedbackError('We could not reach the AI right now.')
    } finally {
      setFeedbackLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">
          {error}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="glass-panel rounded-3xl border border-white/10 p-6 text-white shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">Welcome back</p>
              <h1 className="mt-2 text-3xl font-semibold text-gradient">
                {userProfile?.displayName || currentUser?.email || 'Trailblazer'}
              </h1>
              <p className="mt-2 text-base text-white/70">
                {role === 'student'
                  ? 'Your writing copilots are warmed up—ship polished submissions faster than ever.'
                  : 'Every rubric, review, and AI insight you need to guide your classroom with ease.'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60">Active submissions</p>
              <p className="text-4xl font-semibold">{stats.totalSubmissions || 0}</p>
              <p className="text-xs uppercase tracking-widest text-emerald-300">
                {stats.inReview} in review
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Drafts in progress', value: stats.draft, accent: 'from-sky-400 to-indigo-500' },
              { label: 'Awaiting feedback', value: stats.inReview, accent: 'from-purple-400 to-pink-500' },
              { label: 'Completed loops', value: stats.completed, accent: 'from-emerald-400 to-teal-500' },
              { label: 'AI co-pilot runs', value: stats.aiReviews, accent: 'from-amber-300 to-orange-500' },
            ].map((item) => (
              <div key={item.label} className="grid-sheen rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-widest text-white/60">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold">{item.value}</p>
                <div className={`mt-3 h-1 rounded-full bg-gradient-to-r ${item.accent}`}></div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {role === 'student' && (
              <Link
                to="/submissions/new"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5"
              >
                <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-xs font-semibold text-slate-900">Shift + N</span>
                Compose new submission
              </Link>
            )}

            {role !== 'student' && (
              <Link
                to="/rubrics/new"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7H8m8 4H8m4 4H8" />
                </svg>
                Craft rubric
              </Link>
            )}
            <button
              onClick={loadDashboard}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white"
            >
              Refresh insights
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI pulse</h3>
            <span className="text-xs uppercase tracking-[0.3em] text-white/60">Live</span>
          </div>
          <div className="mt-5 space-y-4">
            <div className="space-y-1 rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-widest text-white/60">Avg. score</p>
              <p className="text-3xl font-semibold">
                {stats.averageScore ? `${stats.averageScore.toFixed(1)}%` : '–'}
              </p>
              <p className="text-xs text-white/60">Across completed evaluations</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">Featured rubric</p>
              {featuredRubric ? (
                <>
                  <p className="mt-1 text-sm font-semibold">{featuredRubric.title}</p>
                  <p className="text-xs text-white/60">
                    {featuredRubric.criteria.length} criteria • {featuredRubric.maxTotalScore} pts
                  </p>
                </>
              ) : (
                <p className="text-sm text-white/70">Create a rubric to jumpstart reviews.</p>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">AI runs this week</p>
              <p className="mt-1 text-3xl font-semibold">{stats.aiReviews}</p>
              <p className="text-xs text-white/60">Coaching loops powered by AI copilots</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: 'Submission health',
            body: `${stats.completed} completed • ${stats.inReview} pending`,
            accent: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
          },
          {
            title: 'Rubric library',
            body: `${stats.totalRubrics} curated frameworks ready to reuse.`,
            accent: 'bg-gradient-to-br from-sky-500 to-indigo-600',
          },
          {
            title: 'AI readiness',
            body: stats.aiReviews
              ? 'AI copilots are actively coaching your assignments.'
              : 'Trigger AI feedback to unlock instant insights.',
            accent: 'bg-gradient-to-br from-violet-500 to-fuchsia-600',
          },
        ].map((card) => (
          <div key={card.title} className={`${card.accent} rounded-3xl p-5 text-white shadow-xl`}>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">{card.title}</p>
            <p className="mt-3 text-lg font-semibold">{card.body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Recent activity</h3>
              <p className="text-sm text-slate-500">Latest submissions and review status</p>
            </div>
            <Link to="/submissions" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
              View all submissions →
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {activity.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No submissions yet—start by crafting your first upload.
              </div>
            )}
            {activity.map((submission) => (
              <div key={submission.id} className="flex items-start justify-between rounded-2xl border border-slate-100 p-4 shadow-sm">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-slate-900">{submission.title}</p>
                    <Badge variant={getStatusBadgeVariant(submission.status)}>
                      {getStatusLabel(submission.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{submission.description || submission.content.slice(0, 120)}...</p>
                  <p className="mt-2 text-xs uppercase tracking-widest text-slate-400">
                    Updated {new Date(submission.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <Link to={`/submissions/${submission.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                  Open
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur">
          <h3 className="text-xl font-semibold text-slate-900">Instant AI feedback</h3>
          <p className="mt-1 text-sm text-slate-500">Drop a paragraph to get tone, clarity, and structure tips.</p>
          <form onSubmit={handleQuickFeedback} className="mt-4 space-y-3">
            <textarea
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="Paste a paragraph or two..."
              className="w-full rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm text-slate-800 shadow-inner outline-none focus:ring-2 focus:ring-indigo-400"
              rows={5}
            />
            {feedbackError && <p className="text-sm text-red-500">{feedbackError}</p>}
            <button
              type="submit"
              disabled={feedbackLoading}
              className="w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {feedbackLoading ? 'Analyzing…' : 'Get AI feedback'}
            </button>
          </form>
          {feedbackResult && (
            <div className="mt-5 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">✨ Summary</p>
              <p className="text-sm text-slate-600">{feedbackResult.summary}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {feedbackResult.wordCount} words analyzed
              </p>
              <div className="space-y-2">
                {feedbackResult.insights.map((tip, index) => (
                  <div key={`${index}-${tip}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                    <p className="text-sm text-slate-600">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
