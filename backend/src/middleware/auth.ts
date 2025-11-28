import { Request, Response, NextFunction } from 'express'
import { getAuth } from '../config/firebase'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string
        email?: string
        role?: string
      }
    }
  }
}

/**
 * Middleware to authenticate Firebase ID token
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' })
      return
    }

    const idToken = authHeader.split('Bearer ')[1]

    if (!idToken) {
      res.status(401).json({ error: 'Invalid token format' })
      return
    }

    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(idToken)

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    }

    // Fetch user role from Firestore
    try {
      const { getFirestore } = await import('../config/firebase')
      const db = getFirestore()
      const userDoc = await db.collection('users').doc(decodedToken.uid).get()
      
      if (userDoc.exists) {
        const userData = userDoc.data()
        req.user.role = userData?.role || 'student'
      } else {
        // Create user profile if it doesn't exist
        const newUser = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          role: 'student', // Default role
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await db.collection('users').doc(decodedToken.uid).set(newUser)
        req.user.role = 'student'
        console.log('Created new user profile:', decodedToken.uid)
      }
    } catch (dbError) {
      console.error('Error fetching user role:', dbError)
      req.user.role = 'student' // Default to student if DB fails
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Middleware to check user role
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      // Get user role from Firestore
      const { getFirestore } = await import('../config/firebase')
      const db = getFirestore()
      const userDoc = await db.collection('users').doc(req.user.uid).get()

      if (!userDoc.exists) {
        res.status(403).json({ error: 'User profile not found' })
        return
      }

      const userData = userDoc.data()
      const userRole = userData?.role

      if (!userRole || !allowedRoles.includes(userRole)) {
        res.status(403).json({ error: 'Insufficient permissions' })
        return
      }

      req.user.role = userRole
      next()
    } catch (error) {
      console.error('Role check error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
