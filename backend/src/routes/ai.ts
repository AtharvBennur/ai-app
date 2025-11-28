import { Router, Request, Response, NextFunction } from 'express'
import { getFirestore } from '../config/firebase'
import { authenticateToken, requireRole } from '../middleware/auth'
import { evaluateSubmission } from '../services/ai'
import { Submission, Evaluation, Rubric } from '../types'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

/**
 * @route   POST /api/ai/evaluate/:submissionId
 * @desc    Trigger AI evaluation for a submission
 * @access  Private (Teachers or submission owner)
 */
router.post('/evaluate/:submissionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { submissionId } = req.params
    const uid = req.user!.uid
    const userRole = req.user!.role

    // Get the submission
    const submissionDoc = await db.collection('submissions').doc(submissionId).get()
    
    if (!submissionDoc.exists) {
      return res.status(404).json({ success: false, error: 'Submission not found' })
    }

    const submission = submissionDoc.data() as Submission

    // Check access - teachers can evaluate any, students can request AI eval on their own
    if (userRole === 'student' && submission.studentId !== uid) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    // Check if submission is in a valid state for evaluation
    if (submission.status === 'draft') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot evaluate a draft submission. Please submit it first.' 
      })
    }

    // Check for existing pending/in-progress AI evaluation
    const existingEval = await db.collection('evaluations')
      .where('submissionId', '==', submissionId)
      .where('evaluatorType', '==', 'ai')
      .where('status', 'in', ['pending', 'in_progress'])
      .limit(1)
      .get()

    if (!existingEval.empty) {
      return res.status(400).json({ 
        success: false, 
        error: 'An AI evaluation is already in progress for this submission' 
      })
    }

    // Get rubric context if available
    let rubricContext: string | undefined
    if (submission.rubricId) {
      const rubricDoc = await db.collection('rubrics').doc(submission.rubricId).get()
      if (rubricDoc.exists) {
        const rubric = rubricDoc.data() as Rubric
        rubricContext = rubric.criteria.map(c => `${c.name}: ${c.description}`).join('; ')
      }
    }

    // Create evaluation record
    const evaluationId = uuidv4()
    const now = new Date()

    const evaluation: Omit<Evaluation, 'id'> = {
      submissionId,
      submissionVersion: submission.currentVersion,
      evaluatorId: 'ai-system',
      evaluatorType: 'ai',
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
      ...(submission.rubricId ? { rubricId: submission.rubricId } : {}),
    }

    await db.collection('evaluations').doc(evaluationId).set(evaluation)

    // Update submission status
    await db.collection('submissions').doc(submissionId).update({
      status: 'under_review',
      updatedAt: now,
    })

    // Send immediate response that evaluation has started
    res.json({
      success: true,
      data: { evaluationId },
      message: 'AI evaluation started. This may take a minute...',
    })

    // Run AI evaluation asynchronously
    try {
      console.log(`Starting AI evaluation for submission ${submissionId}`)
      
      const result = await evaluateSubmission(submission.content, rubricContext)

      // Update evaluation with results
      await db.collection('evaluations').doc(evaluationId).update({
        status: 'completed',
        grammarFeedback: result.grammarFeedback,
        clarityFeedback: result.clarityFeedback,
        structureFeedback: result.structureFeedback,
        contentFeedback: result.contentFeedback,
        overallFeedback: result.overallFeedback,
        suggestions: result.suggestions,
        totalScore: result.totalScore,
        maxPossibleScore: result.maxPossibleScore,
        percentageScore: result.percentageScore,
        completedAt: new Date(),
        updatedAt: new Date(),
      })

      // Update submission status
      await db.collection('submissions').doc(submissionId).update({
        status: 'evaluated',
        updatedAt: new Date(),
      })

      console.log(`AI evaluation completed for submission ${submissionId}`)
    } catch (aiError) {
      console.error('AI evaluation failed:', aiError)
      
      // Mark evaluation as failed
      await db.collection('evaluations').doc(evaluationId).update({
        status: 'completed',
        overallFeedback: 'AI evaluation encountered an error. Please try again or request a manual review.',
        suggestions: ['Request a manual review from your teacher'],
        updatedAt: new Date(),
      })

      // Revert submission status
      await db.collection('submissions').doc(submissionId).update({
        status: 'submitted',
        updatedAt: new Date(),
      })
    }
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/ai/status/:evaluationId
 * @desc    Check status of an AI evaluation
 * @access  Private
 */
router.get('/status/:evaluationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getFirestore()
    const { evaluationId } = req.params
    const uid = req.user!.uid
    const userRole = req.user!.role

    const evalDoc = await db.collection('evaluations').doc(evaluationId).get()

    if (!evalDoc.exists) {
      return res.status(404).json({ success: false, error: 'Evaluation not found' })
    }

    const evaluation = { id: evalDoc.id, ...evalDoc.data() } as Evaluation

    // Check access for students
    if (userRole === 'student') {
      const submissionDoc = await db.collection('submissions').doc(evaluation.submissionId).get()
      if (submissionDoc.exists) {
        const submission = submissionDoc.data() as Submission
        if (submission.studentId !== uid) {
          return res.status(403).json({ success: false, error: 'Access denied' })
        }
      }
    }

    res.json({
      success: true,
      data: {
        status: evaluation.status,
        completedAt: evaluation.completedAt,
        hasResults: evaluation.status === 'completed' && !!evaluation.overallFeedback,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/ai/quick-feedback
 * @desc    Get quick AI feedback on text (without saving)
 * @access  Private
 */
router.post('/quick-feedback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide at least 50 characters of text for analysis' 
      })
    }

    // Limit text length for quick feedback
    const truncatedText = text.substring(0, 1000)

    const result = await evaluateSubmission(truncatedText)

    res.json({
      success: true,
      data: {
        grammarFeedback: result.grammarFeedback,
        clarityFeedback: result.clarityFeedback,
        suggestions: result.suggestions.slice(0, 3),
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
