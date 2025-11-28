export type SubmissionStatus = 'draft' | 'submitted' | 'under_review' | 'evaluated' | 'returned'

export interface Submission {
  id: string
  studentId: string
  studentName: string
  title: string
  description?: string
  content: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  status: SubmissionStatus
  rubricId?: string
  currentVersion: number
  createdAt: string
  updatedAt: string
  submittedAt?: string
}

export interface SubmissionVersion {
  id: string
  submissionId: string
  version: number
  content: string
  createdAt: string
  createdBy: string
}

export interface CreateSubmissionData {
  title: string
  description?: string
  content: string
  rubricId?: string
  fileUrl?: string
  fileName?: string
  fileType?: string
}

export interface RubricCriterion {
  id: string
  name: string
  description: string
  maxScore: number
  weight: number
}

export interface Rubric {
  id: string
  teacherId: string
  teacherName: string
  title: string
  description?: string
  criteria: RubricCriterion[]
  maxTotalScore: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface CriterionScore {
  criterionId: string
  criterionName: string
  score: number
  maxScore: number
  feedback: string
}

export type EvaluatorType = 'teacher' | 'ai'

export interface Evaluation {
  id: string
  submissionId: string
  submissionVersion: number
  rubricId?: string
  evaluatorId: string
  evaluatorType: EvaluatorType
  status: 'pending' | 'in_progress' | 'completed'
  criteriaScores?: CriterionScore[]
  totalScore?: number
  maxPossibleScore?: number
  percentageScore?: number
  grammarFeedback?: string
  clarityFeedback?: string
  structureFeedback?: string
  contentFeedback?: string
  overallFeedback?: string
  suggestions?: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

