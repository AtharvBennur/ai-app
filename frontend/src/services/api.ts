import { auth, isDemoMode } from '../config/firebase'
import { demoClient } from './demoClient'
import { CreateSubmissionData, RubricCriterion, Evaluation } from './types'

export * from './types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

type ApiResponse = { success?: boolean }

async function withDemoFallback<T extends ApiResponse>(
  apiCall: () => Promise<T>,
  fallbackCall?: () => Promise<T>,
): Promise<T> {
  if (isDemoMode && fallbackCall) {
    return fallbackCall()
  }

  try {
    const result = await apiCall()
    if (result?.success === false && fallbackCall) {
      console.warn('API returned error; using demo fallback.')
      return fallbackCall()
    }
    return result
  } catch (error) {
    console.error('API request failed; using demo fallback.', error)
    if (fallbackCall) {
      return fallbackCall()
    }
    throw error
  }
}

// Get the current user's ID token
async function getAuthToken(): Promise<string | null> {
  if (!auth) {
    return isDemoMode ? 'demo-token' : null
  }

  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

// Generic fetch wrapper with auth
async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken()
  
  if (!token) {
    console.warn('No auth token available for request:', endpoint)
  }
  
  const headers: HeadersInit = {
    ...options.headers,
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  // Don't set Content-Type for FormData (browser will set it with boundary)
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json'
  }

  console.log(`API Request: ${options.method || 'GET'} ${endpoint}`)
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    console.error(`API Error: ${response.status} ${response.statusText} for ${endpoint}`)
  }
  
  return response
}

// ============================================
// Submissions API
// ============================================

export const submissionsApi = {
  async list(params?: { status?: string; page?: number; limit?: number }) {
    return withDemoFallback(async () => {
      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.set('status', params.status)
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())

      const query = searchParams.toString()
      const response = await fetchWithAuth(`/api/submissions${query ? `?${query}` : ''}`)
      return response.json()
    }, () => demoClient.listSubmissions(params))
  },

  async get(id: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/submissions/${id}`)
        return response.json()
      },
      () => demoClient.getSubmission(id),
    )
  },

  async create(data: CreateSubmissionData) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth('/api/submissions', {
          method: 'POST',
          body: JSON.stringify(data),
        })
        return response.json()
      },
      () => demoClient.createSubmission(data),
    )
  },

  async update(id: string, data: Partial<CreateSubmissionData>) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/submissions/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
        return response.json()
      },
      () => demoClient.updateSubmission(id, data),
    )
  },

  async submit(id: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/submissions/${id}/submit`, {
          method: 'POST',
        })
        return response.json()
      },
      () => demoClient.submitSubmission(id),
    )
  },

  async delete(id: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/submissions/${id}`, {
          method: 'DELETE',
        })
        return response.json()
      },
      () => demoClient.deleteSubmission(id),
    )
  },

  async getVersions(id: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/submissions/${id}/versions`)
        return response.json()
      },
      () => demoClient.getSubmissionVersions(id),
    )
  },
}

// ============================================
// Rubrics API
// ============================================

export const rubricsApi = {
  async list(params?: { page?: number; limit?: number }) {
    return withDemoFallback(async () => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())

      const query = searchParams.toString()
      const response = await fetchWithAuth(`/api/rubrics${query ? `?${query}` : ''}`)
      return response.json()
    }, () => demoClient.listRubrics(params))
  },

  async get(id: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/rubrics/${id}`)
        return response.json()
      },
      () => demoClient.getRubric(id),
    )
  },

  async getMyRubrics() {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth('/api/rubrics/my')
        return response.json()
      },
      () => demoClient.getMyRubrics(),
    )
  },

  async create(data: { title: string; description?: string; isPublic?: boolean; criteria: Omit<RubricCriterion, 'id'>[] }) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth('/api/rubrics', {
          method: 'POST',
          body: JSON.stringify(data),
        })
        return response.json()
      },
      () => demoClient.createRubric(data),
    )
  },

  async update(id: string, data: { title?: string; description?: string; isPublic?: boolean; criteria?: Omit<RubricCriterion, 'id'>[] }) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/rubrics/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
        return response.json()
      },
      () => demoClient.updateRubric(id, data),
    )
  },

  async delete(id: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/rubrics/${id}`, {
          method: 'DELETE',
        })
        return response.json()
      },
      () => demoClient.deleteRubric(id),
    )
  },
}

// ============================================
// Evaluations API
// ============================================

export const evaluationsApi = {
  async list(params?: { submissionId?: string; status?: string; page?: number; limit?: number }) {
    return withDemoFallback(async () => {
      const searchParams = new URLSearchParams()
      if (params?.submissionId) searchParams.set('submissionId', params.submissionId)
      if (params?.status) searchParams.set('status', params.status)
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())

      const query = searchParams.toString()
      const response = await fetchWithAuth(`/api/evaluations${query ? `?${query}` : ''}`)
      return response.json()
    }, () => demoClient.listEvaluations(params))
  },

  async get(id: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/evaluations/${id}`)
        return response.json()
      },
      () => demoClient.getEvaluation(id),
    )
  },

  async getForSubmission(submissionId: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/evaluations/submission/${submissionId}`)
        return response.json()
      },
      () => demoClient.getEvaluationsForSubmission(submissionId),
    )
  },

  async create(data: { submissionId: string; rubricId?: string; evaluatorType?: 'teacher' | 'ai' }) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth('/api/evaluations', {
          method: 'POST',
          body: JSON.stringify(data),
        })
        return response.json()
      },
      () => demoClient.createEvaluation(data),
    )
  },

  async update(id: string, data: Partial<Evaluation>) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/evaluations/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
        return response.json()
      },
      () => demoClient.updateEvaluation(id, data),
    )
  },

  async complete(id: string, overallFeedback?: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/evaluations/${id}/complete`, {
          method: 'POST',
          body: JSON.stringify({ overallFeedback }),
        })
        return response.json()
      },
      () => demoClient.completeEvaluation(id, overallFeedback),
    )
  },
}

// ============================================
// Upload API
// ============================================

export const uploadApi = {
  async uploadFile(file: File) {
    return withDemoFallback(
      async () => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetchWithAuth('/api/upload', {
          method: 'POST',
          body: formData,
        })
        return response.json()
      },
      () => demoClient.uploadFile(file),
    )
  },

  async deleteFile(filename: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/upload/${filename}`, {
          method: 'DELETE',
        })
        return response.json()
      },
      () => demoClient.deleteFile(filename),
    )
  },
}

// ============================================
// AI API
// ============================================

export const aiApi = {
  async evaluateSubmission(submissionId: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/ai/evaluate/${submissionId}`, {
          method: 'POST',
        })
        return response.json()
      },
      () => demoClient.startAiEvaluation(submissionId),
    )
  },

  async checkStatus(evaluationId: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth(`/api/ai/status/${evaluationId}`)
        return response.json()
      },
      () => demoClient.checkAiStatus(evaluationId),
    )
  },

  async getQuickFeedback(text: string) {
    return withDemoFallback(
      async () => {
        const response = await fetchWithAuth('/api/ai/quick-feedback', {
          method: 'POST',
          body: JSON.stringify({ text }),
        })
        return response.json()
      },
      () => demoClient.getQuickFeedback(text),
    )
  },
}
