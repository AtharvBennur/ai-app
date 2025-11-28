import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'

import { initializeFirebase } from './config/firebase'
import authRoutes from './routes/auth'
import healthRoutes from './routes/health'
import submissionsRoutes from './routes/submissions'
import rubricsRoutes from './routes/rubrics'
import evaluationsRoutes from './routes/evaluations'
import uploadRoutes from './routes/upload'
import aiRoutes from './routes/ai'
import { errorHandler } from './middleware/errorHandler'

// Load environment variables
dotenv.config()

// Initialize Firebase Admin
initializeFirebase()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Routes
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/submissions', submissionsRoutes)
app.use('/api/rubrics', rubricsRoutes)
app.use('/api/evaluations', evaluationsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/ai', aiRoutes)

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
