import type {
  Submission,
  SubmissionStatus,
  SubmissionVersion,
  CreateSubmissionData,
  Rubric,
  RubricCriterion,
  Evaluation,
} from './types'

type ApiSuccess<T> = {
  success: true
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  message?: string
}

type ApiError = {
  success: false
  error: string
}

type ApiResponse<T> = Promise<ApiSuccess<T> | ApiError>

interface SubmissionRecord extends Submission {
  versions: SubmissionVersion[]
}

interface DemoState {
  submissions: SubmissionRecord[]
  rubrics: Rubric[]
  evaluations: Evaluation[]
}

const STORAGE_KEY = 'ai-evaluator-demo-state'

const now = Date.now()

const sampleRubrics: Rubric[] = [
  {
    id: 'rubric-1',
    teacherId: 'teacher-1',
    teacherName: 'Prof. Ada Byron',
    title: 'Analytical Essay Rubric',
    description: 'Structure, evidence, and narrative clarity rubric.',
    criteria: [
      {
        id: 'crit-1',
        name: 'Thesis & Structure',
        description: 'Strength of thesis and logical flow.',
        maxScore: 5,
        weight: 0.25,
      },
      {
        id: 'crit-2',
        name: 'Evidence',
        description: 'Depth and relevance of supporting evidence.',
        maxScore: 5,
        weight: 0.25,
      },
      {
        id: 'crit-3',
        name: 'Clarity',
        description: 'Grammar, tone, and readability.',
        maxScore: 5,
        weight: 0.2,
      },
      {
        id: 'crit-4',
        name: 'Creativity',
        description: 'Original thinking and synthesis.',
        maxScore: 5,
        weight: 0.3,
      },
    ],
    maxTotalScore: 20,
    isPublic: true,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'rubric-2',
    teacherId: 'teacher-2',
    teacherName: 'Dr. Grace Hopper',
    title: 'Research Summary Rubric',
    description: 'Evaluates research depth for science reports.',
    criteria: [
      {
        id: 'crit-5',
        name: 'Research Depth',
        description: 'Breadth of sources and citations.',
        maxScore: 10,
        weight: 0.4,
      },
      {
        id: 'crit-6',
        name: 'Insight',
        description: 'Interpretation and synthesis of findings.',
        maxScore: 10,
        weight: 0.35,
      },
      {
        id: 'crit-7',
        name: 'Writing Quality',
        description: 'Clarity, grammar, and coherence.',
        maxScore: 10,
        weight: 0.25,
      },
    ],
    maxTotalScore: 30,
    isPublic: false,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
]

const sampleSubmissions: SubmissionRecord[] = [
  {
    id: 'sub-1',
    studentId: 'student-1',
    studentName: 'Jordan Rivera',
    title: 'Climate Policy Review',
    description: 'Evaluating policy effectiveness for 2030 targets.',
    content:
      'The Paris Agreement established ambitious climate goals, but policy implementation varies widely across nations...',
    status: 'submitted',
    rubricId: 'rubric-1',
    currentVersion: 2,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 1).toISOString(),
    submittedAt: new Date(now - 1000 * 60 * 60 * 24 * 1).toISOString(),
    fileName: 'climate-policy.pdf',
    fileUrl: '',
    versions: [
      {
        id: 'sub-1-v1',
        submissionId: 'sub-1',
        version: 1,
        content: 'Initial draft content...',
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 6).toISOString(),
        createdBy: 'student-1',
      },
      {
        id: 'sub-1-v2',
        submissionId: 'sub-1',
        version: 2,
        content: 'Revised draft with policy comparison...',
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
        createdBy: 'student-1',
      },
    ],
  },
  {
    id: 'sub-2',
    studentId: 'student-2',
    studentName: 'Neha Patel',
    title: 'AI in Education Reflection',
    description: 'Exploring AI copilots for formative feedback.',
    content:
      'AI copilots can accelerate personalized feedback loops, but instructors must design meaningful prompts...',
    status: 'evaluated',
    rubricId: 'rubric-1',
    currentVersion: 1,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
    submittedAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
    fileName: undefined,
    fileUrl: undefined,
    versions: [
      {
        id: 'sub-2-v1',
        submissionId: 'sub-2',
        version: 1,
        content: 'AI copilots can accelerate personalized feedback loops...',
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString(),
        createdBy: 'student-2',
      },
    ],
  },
  {
    id: 'sub-3',
    studentId: 'student-1',
    studentName: 'Jordan Rivera',
    title: 'Designing Ethical Rubrics',
    description: 'Drafting rubrics for inclusive AI grading.',
    content: 'Equitable rubrics should balance structure with creative freedom...',
    status: 'draft',
    rubricId: undefined,
    currentVersion: 1,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 1).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 1).toISOString(),
    submittedAt: undefined,
    fileName: undefined,
    fileUrl: undefined,
    versions: [
      {
        id: 'sub-3-v1',
        submissionId: 'sub-3',
        version: 1,
        content: 'Equitable rubrics should balance structure...',
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 1).toISOString(),
        createdBy: 'student-1',
      },
    ],
  },
]

const sampleEvaluations: Evaluation[] = [
  {
    id: 'eval-1',
    submissionId: 'sub-2',
    submissionVersion: 1,
    rubricId: 'rubric-1',
    evaluatorId: 'teacher-1',
    evaluatorType: 'ai',
    status: 'completed',
    criteriaScores: [
      {
        criterionId: 'crit-1',
        criterionName: 'Thesis & Structure',
        score: 4.5,
        maxScore: 5,
        feedback: 'Structure is clear with a compelling hook.',
      },
      {
        criterionId: 'crit-2',
        criterionName: 'Evidence',
        score: 4,
        maxScore: 5,
        feedback: 'Consider adding data from formative experiments.',
      },
      {
        criterionId: 'crit-3',
        criterionName: 'Clarity',
        score: 4.2,
        maxScore: 5,
        feedback: 'Great tone—tighten paragraphs 3 and 4.',
      },
      {
        criterionId: 'crit-4',
        criterionName: 'Creativity',
        score: 4.8,
        maxScore: 5,
        feedback: 'Thoughtful insight on instructor workflows.',
      },
    ],
    totalScore: 17.5,
    maxPossibleScore: 20,
    percentageScore: 87.5,
    grammarFeedback: 'Minor tense shifts detected.',
    clarityFeedback: 'Great cadence; consider shorter sentences in section two.',
    structureFeedback: 'Hook and conclusion form a strong loop.',
    contentFeedback: 'Evidence is relevant; add one counterargument.',
    overallFeedback: 'Excellent reflection blending research with personal insight.',
    suggestions: [
      'Add a data point that grounds the anecdote in reality.',
      'Include a quote from a teacher interview to deepen trust.',
    ],
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
    completedAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
]

const defaultState: DemoState = {
  submissions: sampleSubmissions,
  rubrics: sampleRubrics,
  evaluations: sampleEvaluations,
}

let inMemoryState: DemoState = deepClone(defaultState)

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }
  return window.localStorage
}

function loadState(): DemoState {
  const storage = getStorage()
  if (!storage) {
    return deepClone(inMemoryState)
  }

  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) {
    storage.setItem(STORAGE_KEY, JSON.stringify(defaultState))
    return deepClone(defaultState)
  }

  try {
    return JSON.parse(raw) as DemoState
  } catch (error) {
    console.warn('Failed to parse demo state, resetting...', error)
    storage.setItem(STORAGE_KEY, JSON.stringify(defaultState))
    return deepClone(defaultState)
  }
}

function saveState(state: DemoState) {
  const storage = getStorage()
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
  inMemoryState = deepClone(state)
}

function paginate<T>(data: T[], page = 1, limit = 10) {
  const start = (page - 1) * limit
  const items = data.slice(start, start + limit)
  return {
    items,
    meta: {
      page,
      limit,
      total: data.length,
      totalPages: Math.max(1, Math.ceil(data.length / limit)),
    },
  }
}

function success<T>(data: T, pagination?: ApiSuccess<T>['pagination'], message?: string): ApiResponse<T> {
  return Promise.resolve({
    success: true,
    data,
    pagination,
    message,
  })
}

function failure<T = never>(error: string): ApiResponse<T> {
  return Promise.resolve({
    success: false,
    error,
  })
}

function nextId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function stripVersions(record: SubmissionRecord): Submission {
  const { versions, ...rest } = record
  return rest
}

function findSubmission(state: DemoState, id: string) {
  return state.submissions.find((submission) => submission.id === id)
}

function updateSubmissionStatus(submission: SubmissionRecord, status: SubmissionStatus) {
  submission.status = status
  submission.updatedAt = new Date().toISOString()
  if (status === 'submitted') {
    submission.submittedAt = submission.updatedAt
  }
}

export const demoClient = {
  // Submissions
  async listSubmissions(params?: { status?: string; page?: number; limit?: number }) {
    const state = loadState()
    let list = [...state.submissions]

    if (params?.status) {
      list = list.filter((submission) => submission.status === params.status)
    }

    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    const page = params?.page ?? 1
    const limit = params?.limit ?? (list.length || 1)
    const { items, meta } = paginate(list, page, limit)

    return success(items.map(stripVersions), meta)
  },

  async getSubmission(id: string) {
    const state = loadState()
    const submission = findSubmission(state, id)
    if (!submission) {
      return failure('Submission not found')
    }
    return success(stripVersions(submission))
  },

  async createSubmission(data: CreateSubmissionData) {
    const state = loadState()
    const id = nextId('sub')
    const nowIso = new Date().toISOString()
    const version: SubmissionVersion = {
      id: nextId('ver'),
      submissionId: id,
      version: 1,
      content: data.content,
      createdAt: nowIso,
      createdBy: 'demo-student',
    }

    const submission: SubmissionRecord = {
      id,
      studentId: 'demo-student',
      studentName: 'Demo Student',
      title: data.title,
      description: data.description || '',
      content: data.content,
      rubricId: data.rubricId,
      status: 'draft',
      currentVersion: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      versions: [version],
    }

    state.submissions.unshift(submission)
    saveState(state)
    return success(stripVersions(submission))
  },

  async updateSubmission(id: string, updates: Partial<CreateSubmissionData>) {
    const state = loadState()
    const submission = findSubmission(state, id)
    if (!submission) return failure('Submission not found')

    const nowIso = new Date().toISOString()
    const nextSubmission: SubmissionRecord = {
      ...submission,
      ...updates,
      updatedAt: nowIso,
    }

    if (updates.content && updates.content !== submission.content) {
      nextSubmission.currentVersion = submission.currentVersion + 1
      nextSubmission.versions = [
        ...submission.versions,
        {
          id: nextId('ver'),
          submissionId: id,
          version: nextSubmission.currentVersion,
          content: updates.content,
          createdAt: nowIso,
          createdBy: 'demo-student',
        },
      ]
    }

    Object.assign(submission, nextSubmission)
    saveState(state)
    return success(stripVersions(submission))
  },

  async submitSubmission(id: string) {
    const state = loadState()
    const submission = findSubmission(state, id)
    if (!submission) return failure('Submission not found')
    updateSubmissionStatus(submission, 'submitted')
    saveState(state)
    return success(stripVersions(submission))
  },

  async deleteSubmission(id: string) {
    const state = loadState()
    const index = state.submissions.findIndex((submission) => submission.id === id)
    if (index === -1) return failure('Submission not found')
    const [removed] = state.submissions.splice(index, 1)
    saveState(state)
    return success(stripVersions(removed))
  },

  async getSubmissionVersions(id: string) {
    const state = loadState()
    const submission = findSubmission(state, id)
    if (!submission) return failure('Submission not found')
    const versions = [...submission.versions].sort((a, b) => b.version - a.version)
    return success(versions)
  },

  // Rubrics
  async listRubrics(params?: { page?: number; limit?: number }) {
    const state = loadState()
    const page = params?.page ?? 1
    const limit = params?.limit ?? (state.rubrics.length || 1)
    const { items, meta } = paginate(state.rubrics, page, limit)
    return success(items, meta)
  },

  async getRubric(id: string) {
    const state = loadState()
    const rubric = state.rubrics.find((r) => r.id === id)
    return rubric ? success(rubric) : failure('Rubric not found')
  },

  async getMyRubrics() {
    const state = loadState()
    return success(state.rubrics.filter((r) => r.teacherId === 'teacher-1'))
  },

  async createRubric(data: { title: string; description?: string; isPublic?: boolean; criteria: Omit<RubricCriterion, 'id'>[] }) {
    const state = loadState()
    const nowIso = new Date().toISOString()
    const rubric: Rubric = {
      id: nextId('rubric'),
      teacherId: 'teacher-1',
      teacherName: 'Prof. Ada Byron',
      title: data.title,
      description: data.description,
      criteria: data.criteria.map((_criterion, index) => ({
        ..._criterion,
        id: nextId(`crit-${index}`),
      })),
      maxTotalScore: data.criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0),
      isPublic: Boolean(data.isPublic),
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    state.rubrics.unshift(rubric)
    saveState(state)
    return success(rubric)
  },

  async updateRubric(id: string, data: { title?: string; description?: string; isPublic?: boolean; criteria?: Omit<RubricCriterion, 'id'>[] }) {
    const state = loadState()
    const rubric = state.rubrics.find((r) => r.id === id)
    if (!rubric) return failure('Rubric not found')

    if (data.title) rubric.title = data.title
    if (data.description !== undefined) rubric.description = data.description
    if (data.isPublic !== undefined) rubric.isPublic = data.isPublic
    if (data.criteria) {
      rubric.criteria = data.criteria.map((_criterion, index) => ({
        ..._criterion,
        id: nextId(`crit-${index}`),
      }))
      rubric.maxTotalScore = rubric.criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0)
    }
    rubric.updatedAt = new Date().toISOString()
    saveState(state)
    return success(rubric)
  },

  async deleteRubric(id: string) {
    const state = loadState()
    const index = state.rubrics.findIndex((r) => r.id === id)
    if (index === -1) return failure('Rubric not found')
    const [removed] = state.rubrics.splice(index, 1)
    saveState(state)
    return success(removed)
  },

  // Evaluations
  async listEvaluations(params?: { submissionId?: string; status?: string }) {
    const state = loadState()
    let list = [...state.evaluations]
    if (params?.submissionId) {
      list = list.filter((evaluation) => evaluation.submissionId === params.submissionId)
    }
    if (params?.status) {
      list = list.filter((evaluation) => evaluation.status === params.status)
    }
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    return success(list)
  },

  async getEvaluation(id: string) {
    const state = loadState()
    const evaluation = state.evaluations.find((evaluation) => evaluation.id === id)
    return evaluation ? success(evaluation) : failure('Evaluation not found')
  },

  async getEvaluationsForSubmission(submissionId: string) {
    const state = loadState()
    const list = state.evaluations.filter((evaluation) => evaluation.submissionId === submissionId)
    return success(list)
  },

  async createEvaluation(data: { submissionId: string; rubricId?: string; evaluatorType?: 'teacher' | 'ai' }) {
    const state = loadState()
    const submission = findSubmission(state, data.submissionId)
    if (!submission) return failure('Submission not found')

    const nowIso = new Date().toISOString()
    const evaluation: Evaluation = {
      id: nextId('eval'),
      submissionId: submission.id,
      submissionVersion: submission.currentVersion,
      rubricId: data.rubricId,
      evaluatorId: 'teacher-1',
      evaluatorType: data.evaluatorType || 'teacher',
      status: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    state.evaluations.unshift(evaluation)
    saveState(state)
    return success(evaluation)
  },

  async updateEvaluation(id: string, updates: Partial<Evaluation>) {
    const state = loadState()
    const evaluation = state.evaluations.find((evaluation) => evaluation.id === id)
    if (!evaluation) return failure('Evaluation not found')
    Object.assign(evaluation, updates, { updatedAt: new Date().toISOString() })
    saveState(state)
    return success(evaluation)
  },

  async completeEvaluation(id: string, overallFeedback?: string) {
    const state = loadState()
    const evaluation = state.evaluations.find((evaluation) => evaluation.id === id)
    if (!evaluation) return failure('Evaluation not found')

    evaluation.status = 'completed'
    evaluation.overallFeedback = overallFeedback || evaluation.overallFeedback || 'Excellent progress—keep iterating.'
    evaluation.updatedAt = new Date().toISOString()
    evaluation.completedAt = evaluation.updatedAt
    saveState(state)
    return success(evaluation)
  },

  // Upload
  async uploadFile(file: File) {
    const url = typeof window !== 'undefined' ? URL.createObjectURL(file) : ''
    return success({
      originalName: file.name,
      url,
      size: file.size,
      type: file.type,
    })
  },

  async deleteFile(_filename: string) {
    return success({ message: 'File removed' })
  },

  // AI helpers
  async startAiEvaluation(submissionId: string) {
    const state = loadState()
    const submission = findSubmission(state, submissionId)
    if (!submission) return failure('Submission not found')

    const nowIso = new Date().toISOString()
    const evaluation: Evaluation = {
      id: nextId('ai-eval'),
      submissionId,
      submissionVersion: submission.currentVersion,
      evaluatorId: 'ai-engine',
      evaluatorType: 'ai',
      status: 'in_progress',
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    state.evaluations.unshift(evaluation)
    saveState(state)

    // Simulate async completion
    setTimeout(() => {
      const refreshed = loadState()
      const target = refreshed.evaluations.find((item) => item.id === evaluation.id)
      if (!target) return
      target.status = 'completed'
      target.updatedAt = new Date().toISOString()
      target.completedAt = target.updatedAt
      target.criteriaScores = [
        {
          criterionId: 'crit-1',
          criterionName: 'Narrative',
          score: 4.2,
          maxScore: 5,
          feedback: 'Great hook—tighten section 2.',
        },
        {
          criterionId: 'crit-2',
          criterionName: 'Evidence',
          score: 4.0,
          maxScore: 5,
          feedback: 'Add more citations for the policy claim.',
        },
      ]
      target.totalScore = 16.4
      target.maxPossibleScore = 20
      target.percentageScore = 82
      target.grammarFeedback = 'Nothing critical detected.'
      target.structureFeedback = 'Body paragraphs could be shorter.'
      target.contentFeedback = 'Strong voice—consider a counter example.'
      target.overallFeedback = 'Insightful submission with clear improvements.'
      target.suggestions = [
        'Add a chart or visual to ground your argument.',
        'Close with a call-to-action for policymakers.',
      ]
      saveState(refreshed)
    }, 1500)

    return success({ evaluationId: evaluation.id })
  },

  async checkAiStatus(evaluationId: string) {
    const state = loadState()
    const evaluation = state.evaluations.find((evaluation) => evaluation.id === evaluationId)
    if (!evaluation) return failure('Evaluation not found')
    return success(evaluation)
  },

  async getQuickFeedback(text: string) {
    if (!text.trim()) {
      return failure('Please provide some content for feedback.')
    }

    const wordCount = text.trim().split(/\s+/).length
    const insights = [
      'Open with a sharper thesis that previews your key points.',
      'Merge overlapping paragraphs to improve rhythm.',
      'Add data or citations to strengthen your most opinionated claim.',
      'End with a reflection that ties insights back to your audience.',
    ]

    return success({
      summary: 'Bright draft with a confident tone—tighten structure and support bold claims.',
      wordCount,
      insights,
    })
  },
}

