import { Router, Request, Response, NextFunction } from 'express'
import admin from 'firebase-admin'
import { getFirestore } from '../config/firebase'
import { authenticateToken, requireRole } from '../middleware/auth'
import { 
  Submission, 
  CreateSubmissionDTO, 
  UpdateSubmissionDTO,
  SubmissionVersion,
  SubmissionStatus 
} from '../types'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

function getTimestampValue(value: admin.firestore.Timestamp | Date | undefined) {
  if (!value) return 0
  if (value instanceof admin.firestore.Timestamp) {
    return value.toMillis()
  }
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

/**
 * @route   GET /api/submissions
 * @desc    Get all submissions (filtered by role)
 * @access  Private
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { status, page = 1, limit = 10 } = req.query
    const uid = req.user!.uid
    const userRole = req.user!.role

    let query: admin.firestore.Query = db.collection('submissions')

    // Students can only see their own submissions
    if (userRole === 'student') {
      query = query.where('studentId', '==', uid)
    }

    const snapshot = await query.get()

    const submissions: Submission[] = []
    snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      submissions.push({ id: doc.id, ...doc.data() } as Submission)
    })

    // Filter by status if provided
    const filtered = status
      ? submissions.filter((submission) => submission.status === status)
      : submissions

    // Sort by createdAt descending
    filtered.sort(
      (a, b) => getTimestampValue(b.createdAt as admin.firestore.Timestamp | Date) -
        getTimestampValue(a.createdAt as admin.firestore.Timestamp | Date),
    )

    // Pagination in memory
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum
    const paged = filtered.slice(offset, offset + limitNum)
    const total = filtered.length

    res.json({
      success: true,
      data: paged,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/submissions/:id
 * @desc    Get a single submission by ID
 * @access  Private
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { id } = req.params
    const uid = req.user!.uid
    const userRole = req.user!.role

    const doc = await db.collection('submissions').doc(id).get()

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Submission not found' })
    }

    const submission = { id: doc.id, ...doc.data() } as Submission

    // Students can only view their own submissions
    if (userRole === 'student' && submission.studentId !== uid) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    res.json({ success: true, data: submission })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/submissions
 * @desc    Create a new submission
 * @access  Private (Students only)
 */
router.post('/', requireRole('student'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const uid = req.user!.uid
    const { title, description, content, rubricId } = req.body as CreateSubmissionDTO

    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and content are required' 
      })
    }

    // Get student name from user profile
    const userDoc = await db.collection('users').doc(uid).get()
    const userData = userDoc.data()
    const studentName = userData?.displayName || 'Unknown Student'

    const submissionId = uuidv4()
    const now = new Date()

    const submission: Omit<Submission, 'id'> = {
      studentId: uid,
      studentName,
      title,
      description: description || '',
      content,
      status: 'draft',
      currentVersion: 1,
      createdAt: now,
      updatedAt: now,
      ...(rubricId ? { rubricId } : {}),
    }

    await db.collection('submissions').doc(submissionId).set(submission)

    // Create initial version
    const version: Omit<SubmissionVersion, 'id'> = {
      submissionId: submissionId,
      version: 1,
      content,
      createdAt: now,
      createdBy: uid,
    }

    await db.collection('submissions').doc(submissionId)
      .collection('versions').add(version)

    res.status(201).json({
      success: true,
      data: { id: submissionId, ...submission },
      message: 'Submission created successfully',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   PUT /api/submissions/:id
 * @desc    Update a submission
 * @access  Private (Owner only, unless teacher returning)
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { id } = req.params
    const uid = req.user!.uid
    const userRole = req.user!.role
    const updates = req.body as UpdateSubmissionDTO

    const docRef = db.collection('submissions').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Submission not found' })
    }

    const submission = doc.data() as Submission

    // Check permissions
    if (userRole === 'student') {
      if (submission.studentId !== uid) {
        return res.status(403).json({ success: false, error: 'Access denied' })
      }
      // Students can only edit drafts
      if (submission.status !== 'draft' && submission.status !== 'returned') {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot edit a submitted assignment' 
        })
      }
    }

    const now = new Date()
    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    ) as Partial<Submission>

    const updateData: Partial<Submission> = {
      ...sanitizedUpdates,
      updatedAt: now,
    }

    // If content changed, create a new version
    if (updates.content && updates.content !== submission.content) {
      const newVersion = submission.currentVersion + 1
      updateData.currentVersion = newVersion

      const version: Omit<SubmissionVersion, 'id'> = {
        submissionId: id,
        version: newVersion,
        content: updates.content,
        createdAt: now,
        createdBy: uid,
      }

      await docRef.collection('versions').add(version)
    }

    // Handle status change to submitted
    if (updates.status === 'submitted' && submission.status !== 'submitted') {
      updateData.submittedAt = now
    }

    await docRef.update(updateData)

    res.json({
      success: true,
      message: 'Submission updated successfully',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/submissions/:id/submit
 * @desc    Submit an assignment for review
 * @access  Private (Owner only)
 */
router.post('/:id/submit', requireRole('student'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { id } = req.params
    const uid = req.user!.uid

    const docRef = db.collection('submissions').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Submission not found' })
    }

    const submission = doc.data() as Submission

    if (submission.studentId !== uid) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    if (submission.status !== 'draft' && submission.status !== 'returned') {
      return res.status(400).json({ 
        success: false, 
        error: 'Submission is already submitted' 
      })
    }

    const now = new Date()
    await docRef.update({
      status: 'submitted' as SubmissionStatus,
      submittedAt: now,
      updatedAt: now,
    })

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   DELETE /api/submissions/:id
 * @desc    Delete a submission
 * @access  Private (Owner only, drafts only)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { id } = req.params
    const uid = req.user!.uid
    const userRole = req.user!.role

    const docRef = db.collection('submissions').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Submission not found' })
    }

    const submission = doc.data() as Submission

    // Only owner can delete, and only drafts
    if (userRole === 'student') {
      if (submission.studentId !== uid) {
        return res.status(403).json({ success: false, error: 'Access denied' })
      }
      if (submission.status !== 'draft') {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete a submitted assignment' 
        })
      }
    }

    // Delete all versions first
    const versionsSnapshot = await docRef.collection('versions').get()
    const batch = db.batch()
    versionsSnapshot.forEach((versionDoc: admin.firestore.QueryDocumentSnapshot) => {
      batch.delete(versionDoc.ref)
    })
    batch.delete(docRef)
    await batch.commit()

    res.json({
      success: true,
      message: 'Submission deleted successfully',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/submissions/:id/versions
 * @desc    Get version history of a submission
 * @access  Private
 */
router.get('/:id/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { id } = req.params
    const uid = req.user!.uid
    const userRole = req.user!.role

    // Check submission exists and user has access
    const submissionDoc = await db.collection('submissions').doc(id).get()
    
    if (!submissionDoc.exists) {
      return res.status(404).json({ success: false, error: 'Submission not found' })
    }

    const submission = submissionDoc.data() as Submission

    if (userRole === 'student' && submission.studentId !== uid) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const versionsSnapshot = await db.collection('submissions').doc(id)
      .collection('versions')
      .orderBy('version', 'desc')
      .get()

    const versions: SubmissionVersion[] = []
    versionsSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      versions.push({ id: doc.id, ...doc.data() } as SubmissionVersion)
    })

    res.json({ success: true, data: versions })
  } catch (error) {
    next(error)
  }
})

export default router
