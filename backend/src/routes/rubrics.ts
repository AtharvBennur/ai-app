import { Router, Request, Response, NextFunction } from 'express'
import admin from 'firebase-admin'
import { getFirestore } from '../config/firebase'
import { authenticateToken, requireRole } from '../middleware/auth'
import { Rubric, CreateRubricDTO, UpdateRubricDTO, RubricCriterion } from '../types'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

function sortByCreatedAtDesc(items: Rubric[]) {
  return items.sort((a, b) => {
    const aValue =
      a.createdAt instanceof admin.firestore.Timestamp
        ? a.createdAt.toMillis()
        : new Date(a.createdAt).getTime()
    const bValue =
      b.createdAt instanceof admin.firestore.Timestamp
        ? b.createdAt.toMillis()
        : new Date(b.createdAt).getTime()
    return bValue - aValue
  })
}

/**
 * @route   GET /api/rubrics
 * @desc    Get all rubrics (teachers see all, students see public only)
 * @access  Private
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const uid = req.user!.uid
    const userRole = req.user!.role
    const { page = 1, limit = 10 } = req.query

    let query: admin.firestore.Query = db.collection('rubrics')

    // Students can only see public rubrics
    if (userRole === 'student') {
      query = query.where('isPublic', '==', true)
    }

    const snapshot = await query.get()
    const allRubrics: Rubric[] = []
    snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      allRubrics.push({ id: doc.id, ...doc.data() } as Rubric)
    })

    const sorted = sortByCreatedAtDesc(allRubrics)

    // Pagination in memory
    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const offset = (pageNum - 1) * limitNum
    const paged = sorted.slice(offset, offset + limitNum)
    const total = sorted.length

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
 * @route   GET /api/rubrics/my
 * @desc    Get rubrics created by the current teacher
 * @access  Private (Teachers only)
 */
router.get('/my', requireRole('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const uid = req.user!.uid

    const snapshot = await db.collection('rubrics')
      .where('teacherId', '==', uid)
      .get()

    const rubrics: Rubric[] = []
    snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      rubrics.push({ id: doc.id, ...doc.data() } as Rubric)
    })

    const sorted = sortByCreatedAtDesc(rubrics)

    res.json({ success: true, data: sorted })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/rubrics/:id
 * @desc    Get a single rubric by ID
 * @access  Private
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { id } = req.params
    const userRole = req.user!.role

    const doc = await db.collection('rubrics').doc(id).get()

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Rubric not found' })
    }

    const rubric = { id: doc.id, ...doc.data() } as Rubric

    // Students can only view public rubrics
    if (userRole === 'student' && !rubric.isPublic) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    res.json({ success: true, data: rubric })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/rubrics
 * @desc    Create a new rubric
 * @access  Private (Teachers only)
 */
router.post('/', requireRole('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const uid = req.user!.uid
    const { title, description, criteria, isPublic = false } = req.body as CreateRubricDTO

    if (!title || !criteria || criteria.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and at least one criterion are required' 
      })
    }

    // Validate criteria weights sum to 100
    const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0)
    if (totalWeight !== 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Criteria weights must sum to 100' 
      })
    }

    // Get teacher name
    const userDoc = await db.collection('users').doc(uid).get()
    const userData = userDoc.data()
    const teacherName = userData?.displayName || 'Unknown Teacher'

    const rubricId = uuidv4()
    const now = new Date()

    // Add IDs to criteria and calculate max score
    const criteriaWithIds: RubricCriterion[] = criteria.map(c => ({
      ...c,
      id: uuidv4(),
    }))

    const maxTotalScore = criteriaWithIds.reduce((sum, c) => sum + c.maxScore, 0)

    const rubric: Omit<Rubric, 'id'> = {
      teacherId: uid,
      teacherName,
      title,
      description: description || '',
      criteria: criteriaWithIds,
      maxTotalScore,
      isPublic,
      createdAt: now,
      updatedAt: now,
    }

    await db.collection('rubrics').doc(rubricId).set(rubric)

    res.status(201).json({
      success: true,
      data: { id: rubricId, ...rubric },
      message: 'Rubric created successfully',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   PUT /api/rubrics/:id
 * @desc    Update a rubric
 * @access  Private (Owner only)
 */
router.put('/:id', requireRole('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { id } = req.params
    const uid = req.user!.uid
    const updates = req.body as UpdateRubricDTO

    const docRef = db.collection('rubrics').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Rubric not found' })
    }

    const rubric = doc.data() as Rubric

    // Only owner can update
    if (rubric.teacherId !== uid && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const updateData: Partial<Rubric> = {
      updatedAt: new Date(),
    }

    if (updates.title) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic

    // Handle criteria update
    if (updates.criteria) {
      const totalWeight = updates.criteria.reduce((sum, c) => sum + (c.weight || 0), 0)
      if (totalWeight !== 100) {
        return res.status(400).json({ 
          success: false, 
          error: 'Criteria weights must sum to 100' 
        })
      }

      const criteriaWithIds: RubricCriterion[] = updates.criteria.map(c => ({
        ...c,
        id: uuidv4(),
      }))

      updateData.criteria = criteriaWithIds
      updateData.maxTotalScore = criteriaWithIds.reduce((sum, c) => sum + c.maxScore, 0)
    }

    await docRef.update(updateData)

    res.json({
      success: true,
      message: 'Rubric updated successfully',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   DELETE /api/rubrics/:id
 * @desc    Delete a rubric
 * @access  Private (Owner only)
 */
router.delete('/:id', requireRole('teacher', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { id } = req.params
    const uid = req.user!.uid

    const docRef = db.collection('rubrics').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Rubric not found' })
    }

    const rubric = doc.data() as Rubric

    // Only owner can delete
    if (rubric.teacherId !== uid && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    // Check if rubric is in use by any submissions
    const submissionsUsingRubric = await db.collection('submissions')
      .where('rubricId', '==', id)
      .limit(1)
      .get()

    if (!submissionsUsingRubric.empty) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete rubric that is in use by submissions' 
      })
    }

    await docRef.delete()

    res.json({
      success: true,
      message: 'Rubric deleted successfully',
    })
  } catch (error) {
    next(error)
  }
})

export default router
