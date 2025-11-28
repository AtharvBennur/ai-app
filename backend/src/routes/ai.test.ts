import request from 'supertest'
import express from 'express'

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ 
          exists: true, 
          data: () => ({ 
            content: 'Test content',
            status: 'submitted',
            currentVersion: 1,
            studentId: 'test-user-id'
          }) 
        }),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      })),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ empty: true }),
    })),
  })),
}))

// Mock AI service
jest.mock('../services/ai', () => ({
  evaluateSubmission: jest.fn().mockResolvedValue({
    grammarFeedback: 'Good grammar',
    clarityFeedback: 'Clear writing',
    structureFeedback: 'Well structured',
    contentFeedback: 'Good content',
    overallFeedback: 'Great work!',
    suggestions: ['Keep it up'],
    totalScore: 85,
    maxPossibleScore: 100,
    percentageScore: 85,
  }),
}))

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { uid: 'test-user-id', role: 'student' }
    next()
  },
  requireRole: (...roles: string[]) => (req: any, res: any, next: any) => {
    if (roles.includes(req.user?.role)) {
      next()
    } else {
      res.status(403).json({ error: 'Forbidden' })
    }
  },
}))

import aiRoutes from './ai'

const app = express()
app.use(express.json())
app.use('/api/ai', aiRoutes)

describe('AI Routes', () => {
  describe('POST /api/ai/evaluate/:submissionId', () => {
    it('should start AI evaluation for a valid submission', async () => {
      const response = await request(app)
        .post('/api/ai/evaluate/test-submission-id')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.evaluationId).toBeDefined()
      expect(response.body.message).toContain('AI evaluation started')
    })
  })

  describe('POST /api/ai/quick-feedback', () => {
    it('should return 400 if text is too short', async () => {
      const response = await request(app)
        .post('/api/ai/quick-feedback')
        .send({ text: 'Short' })
        .expect('Content-Type', /json/)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('at least 50 characters')
    })

    it('should return feedback for valid text', async () => {
      const longText = 'This is a longer text that has more than fifty characters for testing purposes.'
      const response = await request(app)
        .post('/api/ai/quick-feedback')
        .send({ text: longText })
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.grammarFeedback).toBeDefined()
    })
  })
})
