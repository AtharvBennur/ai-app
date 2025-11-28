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
        collection: jest.fn().mockReturnThis(),
      })),
    })),
    batch: jest.fn(() => ({
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),
  })),
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

import submissionsRoutes from './submissions'

const app = express()
app.use(express.json())
app.use('/api/submissions', submissionsRoutes)

describe('Submissions Routes', () => {
  describe('GET /api/submissions', () => {
    it('should return empty submissions list', async () => {
      const response = await request(app)
        .get('/api/submissions')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([])
      expect(response.body.pagination).toBeDefined()
    })
  })

  describe('POST /api/submissions', () => {
    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .send({ content: 'Test content' })
        .expect('Content-Type', /json/)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Title and content are required')
    })

    it('should return 400 if content is missing', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .send({ title: 'Test title' })
        .expect('Content-Type', /json/)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Title and content are required')
    })
  })

  describe('GET /api/submissions/:id', () => {
    it('should return 404 for non-existent submission', async () => {
      const response = await request(app)
        .get('/api/submissions/non-existent-id')
        .expect('Content-Type', /json/)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Submission not found')
    })
  })
})
