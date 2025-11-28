import request from 'supertest'
import express from 'express'

// Mock firebase-admin before importing routes
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        forEach: jest.fn(),
        empty: true,
        docs: [],
      }),
      count: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
      }),
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ exists: false }),
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
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

import rubricsRoutes from './rubrics'

const app = express()
app.use(express.json())
app.use('/api/rubrics', rubricsRoutes)

describe('Rubrics Routes', () => {
  describe('GET /api/rubrics', () => {
    it('should return empty rubrics list', async () => {
      const response = await request(app)
        .get('/api/rubrics')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([])
      expect(response.body.pagination).toBeDefined()
    })
  })

  describe('POST /api/rubrics', () => {
    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .send({ criteria: [] })
        .expect('Content-Type', /json/)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Title and at least one criterion are required')
    })

    it('should return 400 if criteria is empty', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .send({ title: 'Test Rubric', criteria: [] })
        .expect('Content-Type', /json/)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Title and at least one criterion are required')
    })

    it('should return 400 if criteria weights do not sum to 100', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .send({
          title: 'Test Rubric',
          criteria: [
            { name: 'Grammar', description: 'Test', maxScore: 25, weight: 50 },
          ],
        })
        .expect('Content-Type', /json/)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Criteria weights must sum to 100')
    })
  })

  describe('GET /api/rubrics/:id', () => {
    it('should return 404 for non-existent rubric', async () => {
      const response = await request(app)
        .get('/api/rubrics/non-existent-id')
        .expect('Content-Type', /json/)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Rubric not found')
    })
  })
})
