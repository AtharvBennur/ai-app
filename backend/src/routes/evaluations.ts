import { Router, Request, Response, NextFunction } from 'express'
import admin from 'firebase-admin'
import { getFirestore } from '../config/firebase'
import { authenticateToken, requireRole } from '../middleware/auth'
import { 
  Evaluation, 
  CreateEvaluationDTO, 
  UpdateEvaluationDTO,
  Submission,
  EvaluationStatus 
} from '../types'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

function getTimestampValue(value: admin.firestore.Timestamp | Date | undefined): number {
  if (!value) return 0
  if (value instanceof admin.firestore.Timestamp) {
    return value.toMillis()
  }
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

// All routes require authentication
router.use(authenticateToken)

/**
 * @route   GET /api/evaluations
 * @desc    Get evaluations (filtered by role)
 * @access  Private
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const uid = req.user!.uid
    const userRole = req.user!.role
    const { submissionId, evaluatorType, status, page = 1, limit = 10 } = req.query

    let query: admin.firestore.Query = db.collection('evaluations')

    // Filter by submission if provided
    if (submissionId) {
      query = query.where('submissionId', '==', submissionId)
    }

    // Filter by evaluator type
    if (evaluatorType) {
      query = query.where('evaluatorType', '==', evaluatorType)
    }

    // Filter by status
    if (status) {
      query = query.where('status', '==', status)
    }

    const snapshot = await query.get()
    
    let evaluations: Evaluation[] = []
    snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      evaluations.push({ id: doc.id, ...doc.data() } as Evaluation)
    })

    // For students, filter to only show evaluations of their submissions
    if (userRole === 'student') {
      // Get student's submission IDs
      const submissionsSnapshot = await db.collection('submissions')
        .where('studentId', '==', uid)
        .select()
        .get()
      
      const studentSubmissionIds = new Set(submissionsSnapshot.docs.map((d: admin.firestore.QueryDocumentSnapshot) => d.id))
      evaluations = evaluations.filter(e => studentSubmissionIds.has(e.submissionId))
    }

    const sorted = evaluations.sort(
      (a, b) => getTimestampValue(b.createdAt as admin.firestore.Timestamp | Date) -
        getTimestampValue(a.createdAt as admin.firestore.Timestamp | Date),
    )

    // Pagination
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum
    const paged = sorted.slice(offset, offset + limitNum)

    res.json({
      success: true,
      data: paged,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: sorted.length,
        totalPages: Math.ceil(sorted.length / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/evaluations/:id
 * @desc    Get a single evaluation by ID
 * @access  Private
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { id } = req.params
    const uid = req.user!.uid
    const userRole = req.user!.role

    const doc = await db.collection('evaluations').doc(id).get()

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Evaluation not found' })
    }

    const evaluation = { id: doc.id, ...doc.data() } as Evaluation

    // Check access for students
    if (userRole === 'student') {
      const submissionDoc = await db.collection('submissions').doc(evaluation.submissionId).get()
      if (!submissionDoc.exists) {
        return res.status(404).json({ success: false, error: 'Submission not found' })
      }
      const submission = submissionDoc.data() as Submission
      if (submission.studentId !== uid) {
        return res.status(403).json({ success: false, error: 'Access denied' })
      }
    }

    res.json({ success: true, data: evaluation })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/evaluations
 * @desc    Create a new evaluation (start evaluation process)
 * @access  Private (Teachers only for manual, system for AI)
 */
router.post('/', requireRole('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const uid = req.user!.uid
    const { submissionId, rubricId, evaluatorType = 'teacher' } = req.body as CreateEvaluationDTO

    if (!submissionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Submission ID is required' 
      })
    }

    // Verify submission exists and is submitted
    const submissionDoc = await db.collection('submissions').doc(submissionId).get()
    if (!submissionDoc.exists) {
      return res.status(404).json({ success: false, error: 'Submission not found' })
    }

    const submission = submissionDoc.data() as Submission
    if (submission.status === 'draft') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot evaluate a draft submission' 
      })
    }

    // Check if there's already a pending/in-progress evaluation by this evaluator type
    const existingEval = await db.collection('evaluations')
      .where('submissionId', '==', submissionId)
      .where('evaluatorType', '==', evaluatorType)
      .where('status', 'in', ['pending', 'in_progress'])
      .limit(1)
      .get()

    if (!existingEval.empty) {
      return res.status(400).json({ 
        success: false, 
        error: 'An evaluation is already in progress for this submission' 
      })
    }

    const evaluationId = uuidv4()
    const now = new Date()

    const evaluation: Omit<Evaluation, 'id'> = {
      submissionId,
      submissionVersion: submission.currentVersion,
      rubricId: rubricId || submission.rubricId,
      evaluatorId: evaluatorType === 'teacher' ? uid : 'ai-system',
      evaluatorType,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }

    await db.collection('evaluations').doc(evaluationId).set(evaluation)

    // Update submission status
    await db.collection('submissions').doc(submissionId).update({
      status: 'under_review',
      updatedAt: now,
    })

    res.status(201).json({
      success: true,
      data: { id: evaluationId, ...evaluation },
      message: 'Evaluation started successfully',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   PUT /api/evaluations/:id
 * @desc    Update an evaluation (add scores, feedback)
 * @access  Private (Evaluator only)
 */
router.put('/:id', requireRole('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { id } = req.params
    const uid = req.user!.uid
    const updates = req.body as UpdateEvaluationDTO

    const docRef = db.collection('evaluations').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Evaluation not found' })
    }

    const evaluation = doc.data() as Evaluation

    // Only the evaluator can update (unless admin)
    if (evaluation.evaluatorId !== uid && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    // Cannot update completed evaluations
    if (evaluation.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot update a completed evaluation' 
      })
    }

    const now = new Date()
    const updateData: Partial<Evaluation> = {
      ...updates,
      updatedAt: now,
    }

    // Calculate percentage score if total and max provided
    if (updates.totalScore !== undefined && evaluation.maxPossibleScore) {
      updateData.percentageScore = (updates.totalScore / evaluation.maxPossibleScore) * 100
    }

    // If status is being set to completed
    if (updates.status === 'completed') {
      updateData.completedAt = now

      // Update submission status to evaluated
      await db.collection('submissions').doc(evaluation.submissionId).update({
        status: 'evaluated',
        updatedAt: now,
      })
    }

    await docRef.update(updateData)

    res.json({
      success: true,
      message: 'Evaluation updated successfully',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/evaluations/:id/complete
 * @desc    Mark an evaluation as complete
 * @access  Private (Evaluator only)
 */
router.post('/:id/complete', requireRole('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { id } = req.params
    const uid = req.user!.uid
    const { overallFeedback } = req.body

    const docRef = db.collection('evaluations').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Evaluation not found' })
    }

    const evaluation = doc.data() as Evaluation

    if (evaluation.evaluatorId !== uid && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    if (evaluation.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Evaluation is already completed' 
      })
    }

    const now = new Date()

    await docRef.update({
      status: 'completed' as EvaluationStatus,
      overallFeedback: overallFeedback || evaluation.overallFeedback,
      completedAt: now,
      updatedAt: now,
    })

    // Update submission status
    await db.collection('submissions').doc(evaluation.submissionId).update({
      status: 'evaluated',
      updatedAt: now,
    })

    res.json({
      success: true,
      message: 'Evaluation completed successfully',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/evaluations/submission/:submissionId
 * @desc    Get all evaluations for a submission
 * @access  Private
 */
router.get('/submission/:submissionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { submissionId } = req.params
    const uid = req.user!.uid
    const userRole = req.user!.role

    // Check submission access
    const submissionDoc = await db.collection('submissions').doc(submissionId).get()
    if (!submissionDoc.exists) {
      return res.status(404).json({ success: false, error: 'Submission not found' })
    }

    const submission = submissionDoc.data() as Submission

    if (userRole === 'student' && submission.studentId !== uid) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const snapshot = await db.collection('evaluations')
      .where('submissionId', '==', submissionId)
      .get()

    const evaluations: Evaluation[] = []
    snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      evaluations.push({ id: doc.id, ...doc.data() } as Evaluation)
    })

    evaluations.sort(
      (a, b) => getTimestampValue(b.createdAt as admin.firestore.Timestamp | Date) -
        getTimestampValue(a.createdAt as admin.firestore.Timestamp | Date),
    )

    res.json({ success: true, data: evaluations })
  } catch (error) {
    next(error)
  }
})

export default router
