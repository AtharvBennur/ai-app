import request from 'supertest'
import express from 'express'

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        forEach: jest.fn(),
        empty: true,
        docs: [],
      }),
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ exists: false }),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      })),
    })),
  })),
}))

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { uid: 'test-teacher-id', role: 'teacher' }
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

import evaluationsRoutes from './evaluations'

const app = express()
app.use(express.json())
app.use('/api/evaluations', evaluationsRoutes)

describe('Evaluations Routes', () => {
  describe('GET /api/evaluations', () => {
    it('should return evaluations list', async () => {
      const response = await request(app)
        .get('/api/evaluations')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([])
      expect(response.body.pagination).toBeDefined()
    })
  })

  describe('GET /api/evaluations/:id', () => {
    it('should return 404 for non-existent evaluation', async () => {
      const response = await request(app)
        .get('/api/evaluations/non-existent-id')
        .expect('Content-Type', /json/)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Evaluation not found')
    })
  })

  describe('POST /api/evaluations', () => {
    it('should return 400 if submissionId is missing', async () => {
      const response = await request(app)
        .post('/api/evaluations')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Submission ID is required')
    })
  })
})
