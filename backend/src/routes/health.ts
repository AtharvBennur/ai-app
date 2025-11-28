import { Router, Request, Response } from 'express'

const router = Router()

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  })
})

/**
 * @route   GET /api/health/ready
 * @desc    Readiness check endpoint
 * @access  Public
 */
router.get('/ready', (_req: Request, res: Response) => {
  // Add checks for database connectivity, etc.
  res.json({
    status: 'ready',
    services: {
      firebase: process.env.FIREBASE_PROJECT_ID ? 'configured' : 'not configured',
      ai: process.env.HF_API_KEY ? 'configured' : 'not configured',
    },
  })
})

export default router
