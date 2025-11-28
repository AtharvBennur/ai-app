// ============================================
// Core Data Models for AI Assignment Evaluation
// ============================================

// User roles
export type UserRole = 'student' | 'teacher' | 'admin'

// Submission status
export type SubmissionStatus = 'draft' | 'submitted' | 'under_review' | 'evaluated' | 'returned'

// Evaluation status
export type EvaluationStatus = 'pending' | 'in_progress' | 'completed'

// ============================================
// User Model
// ============================================
export interface User {
  uid: string
  email: string
  displayName: string
  role: UserRole
  createdAt: Date
  updatedAt?: Date
}

export interface CreateUserDTO {
  email: string
  displayName: string
  role: UserRole
}

// ============================================
// Submission Model
// ============================================
export interface Submission {
  id: string
  studentId: string
  studentName: string
  title: string
  description?: string
  content: string                    // Text content of the assignment
  fileUrl?: string                   // Optional file attachment URL
  fileName?: string                  // Original file name
  fileType?: string                  // MIME type
  status: SubmissionStatus
  rubricId?: string                  // Optional rubric to evaluate against
  currentVersion: number
  createdAt: Date
  updatedAt: Date
  submittedAt?: Date                 // When status changed to 'submitted'
}

export interface CreateSubmissionDTO {
  title: string
  description?: string
  content: string
  rubricId?: string
}

export interface UpdateSubmissionDTO {
  title?: string
  description?: string
  content?: string
  rubricId?: string
  status?: SubmissionStatus
}

// ============================================
// Submission Version Model (for version history)
// ============================================
export interface SubmissionVersion {
  id: string
  submissionId: string
  version: number
  content: string
  fileUrl?: string
  fileName?: string
  createdAt: Date
  createdBy: string                  // User ID who created this version
}

// ============================================
// Rubric Model
// ============================================
export interface RubricCriterion {
  id: string
  name: string
  description: string
  maxScore: number
  weight: number                     // Percentage weight (0-100)
}

export interface Rubric {
  id: string
  teacherId: string
  teacherName: string
  title: string
  description?: string
  criteria: RubricCriterion[]
  maxTotalScore: number
  isPublic: boolean                  // Can students see this rubric?
  createdAt: Date
  updatedAt: Date
}

export interface CreateRubricDTO {
  title: string
  description?: string
  criteria: Omit<RubricCriterion, 'id'>[]
  isPublic?: boolean
}

export interface UpdateRubricDTO {
  title?: string
  description?: string
  criteria?: Omit<RubricCriterion, 'id'>[]
  isPublic?: boolean
}

// ============================================
// Evaluation Model
// ============================================
export interface CriterionScore {
  criterionId: string
  criterionName: string
  score: number
  maxScore: number
  feedback: string
}

export interface Evaluation {
  id: string
  submissionId: string
  submissionVersion: number          // Which version was evaluated
  rubricId?: string
  evaluatorId: string                // Teacher or AI
  evaluatorType: 'teacher' | 'ai'
  status: EvaluationStatus
  
  // Scores
  criteriaScores?: CriterionScore[]
  totalScore?: number
  maxPossibleScore?: number
  percentageScore?: number
  
  // AI-generated feedback
  grammarFeedback?: string
  clarityFeedback?: string
  structureFeedback?: string
  contentFeedback?: string
  overallFeedback?: string
  
  // Suggestions
  suggestions?: string[]
  
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface CreateEvaluationDTO {
  submissionId: string
  rubricId?: string
  evaluatorType: 'teacher' | 'ai'
}

export interface UpdateEvaluationDTO {
  status?: EvaluationStatus
  criteriaScores?: CriterionScore[]
  totalScore?: number
  grammarFeedback?: string
  clarityFeedback?: string
  structureFeedback?: string
  contentFeedback?: string
  overallFeedback?: string
  suggestions?: string[]
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================
// Query Parameters
// ============================================
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface SubmissionQueryParams extends PaginationParams {
  status?: SubmissionStatus
  studentId?: string
}

export interface EvaluationQueryParams extends PaginationParams {
  submissionId?: string
  evaluatorType?: 'teacher' | 'ai'
  status?: EvaluationStatus
}
