import { Router, Request, Response, NextFunction, RequestHandler } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for local file storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const baseName = path.basename(file.originalname, ext)
    cb(null, `${uniqueSuffix}-${baseName}${ext}`)
  },
})

// File filter - allow common document types
const fileFilter: Exclude<multer.Options['fileFilter'], undefined> = (_req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG, GIF'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
})

const singleFileUpload: RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, next)
}

// All routes require authentication
router.use(authenticateToken)

/**
 * @route   POST /api/upload
 * @desc    Upload a file
 * @access  Private
 */
router.post('/', singleFileUpload, (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      })
    }

    const fileUrl = `/uploads/${req.file.filename}`

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
      },
      message: 'File uploaded successfully',
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
    })
  }
})

/**
 * @route   DELETE /api/upload/:filename
 * @desc    Delete an uploaded file
 * @access  Private
 */
router.delete('/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params
    const filePath = path.join(uploadsDir, filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      })
    }

    fs.unlinkSync(filePath)

    res.json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
    })
  }
})

// Error handling middleware for multer
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB',
      })
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    })
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    })
  }
})

export default router
