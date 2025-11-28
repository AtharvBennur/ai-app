import request from 'supertest'
import express from 'express'
import authRoutes from './auth'

// Create a test app
const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)

describe('Auth Routes', () => {
  describe('GET /api/auth/check', () => {
    it('should return success message', async () => {
      const response = await request(app)
        .get('/api/auth/check')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toEqual({
        success: true,
        message: 'Auth routes are working',
      })
    })
  })

  describe('POST /api/auth/verify', () => {
    it('should return 400 if no token provided', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400)

      expect(response.body).toEqual({
        error: 'ID token is required',
      })
    })
  })
})
