import { Router, Request, Response, NextFunction } from 'express'
import { getAuth, getFirestore } from '../config/firebase'
import { authenticateToken } from '../middleware/auth'

const router = Router()

/**
 * @route   POST /api/auth/verify
 * @desc    Verify Firebase ID token and return user info
 * @access  Public (with token)
 */
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' })
    }

    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(idToken)
    
    // Get user profile from Firestore
    const db = getFirestore()
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()
    
    const userProfile = userDoc.exists ? userDoc.data() : null

    res.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        profile: userProfile,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = req.user?.uid

    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const db = getFirestore()
    const userDoc = await db.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    res.json({
      success: true,
      user: {
        uid,
        ...userDoc.data(),
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = req.user?.uid

    if (!uid) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { displayName } = req.body
    const updates: Record<string, unknown> = {}

    if (displayName) {
      updates.displayName = displayName
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    updates.updatedAt = new Date()

    const db = getFirestore()
    await db.collection('users').doc(uid).update(updates)

    res.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/auth/check
 * @desc    Simple auth check endpoint (for testing)
 * @access  Public
 */
router.get('/check', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Auth routes are working',
  })
})

export default router
