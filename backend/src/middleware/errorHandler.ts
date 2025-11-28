import { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
  statusCode?: number
  code?: string
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err)

  // Firebase Auth errors
  if (typeof err.code === 'string' && err.code.startsWith('auth/')) {
    res.status(401).json({
      error: 'Authentication error',
      message: getFirebaseAuthErrorMessage(err.code),
    })
    return
  }

  // Default error response
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

function getFirebaseAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/id-token-expired': 'Your session has expired. Please sign in again.',
    'auth/id-token-revoked': 'Your session has been revoked. Please sign in again.',
    'auth/invalid-id-token': 'Invalid authentication token.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'User not found.',
  }

  return messages[code] || 'Authentication failed.'
}
