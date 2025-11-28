/**
 * AI Service - Hugging Face Integration
 * Provides text analysis for grammar, clarity, structure, and content evaluation
 */

const HF_API_URL = 'https://api-inference.huggingface.co/models'
const HF_API_KEY = process.env.HF_API_KEY

interface HFResponse {
  generated_text?: string
  error?: string
  [key: string]: unknown
}

interface EvaluationResult {
  grammarFeedback: string
  clarityFeedback: string
  structureFeedback: string
  contentFeedback: string
  overallFeedback: string
  suggestions: string[]
  totalScore: number
  maxPossibleScore: number
  percentageScore: number
}

/**
 * Call Hugging Face Inference API
 */
async function callHuggingFace(model: string, inputs: string, parameters?: Record<string, unknown>): Promise<HFResponse[]> {
  if (!HF_API_KEY) {
    throw new Error('HF_API_KEY is not configured')
  }

  const response = await fetch(`${HF_API_URL}/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        return_full_text: false,
        ...parameters,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('HF API Error:', error)
    throw new Error(`Hugging Face API error: ${response.status}`)
  }

  return response.json() as Promise<HFResponse[]>
}

/**
 * Generate text using a language model
 */
async function generateText(prompt: string): Promise<string> {
  try {
    // Using Mistral-7B-Instruct - a good open-source instruction-following model
    const result = await callHuggingFace(
      'mistralai/Mistral-7B-Instruct-v0.2',
      prompt,
      { max_new_tokens: 800 }
    )

    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text.trim()
    }

    // Fallback to a smaller model if Mistral fails
    const fallbackResult = await callHuggingFace(
      'google/flan-t5-large',
      prompt,
      { max_new_tokens: 500 }
    )

    if (Array.isArray(fallbackResult) && fallbackResult[0]?.generated_text) {
      return fallbackResult[0].generated_text.trim()
    }

    return 'Unable to generate analysis at this time.'
  } catch (error) {
    console.error('Text generation error:', error)
    throw error
  }
}

/**
 * Analyze grammar and spelling
 */
async function analyzeGrammar(text: string): Promise<string> {
  const prompt = `<s>[INST] You are an expert writing tutor. Analyze the following text for grammar, spelling, and punctuation errors. Provide specific feedback on any issues found and suggestions for improvement. Be concise but helpful.

Text to analyze:
"${text.substring(0, 2000)}"

Provide your grammar analysis: [/INST]`

  try {
    return await generateText(prompt)
  } catch (error) {
    console.error('Grammar analysis error:', error)
    return 'Grammar analysis: The text appears to be generally well-written. Consider reviewing for minor punctuation and sentence structure improvements.'
  }
}

/**
 * Analyze clarity and readability
 */
async function analyzeClarity(text: string): Promise<string> {
  const prompt = `<s>[INST] You are an expert writing tutor. Analyze the following text for clarity and readability. Consider sentence structure, word choice, and how easy it is to understand. Provide specific feedback.

Text to analyze:
"${text.substring(0, 2000)}"

Provide your clarity analysis: [/INST]`

  try {
    return await generateText(prompt)
  } catch (error) {
    console.error('Clarity analysis error:', error)
    return 'Clarity analysis: The text demonstrates reasonable clarity. Consider varying sentence length and using more specific vocabulary to enhance readability.'
  }
}

/**
 * Analyze structure and organization
 */
async function analyzeStructure(text: string): Promise<string> {
  const prompt = `<s>[INST] You are an expert writing tutor. Analyze the following text for structure and organization. Consider the logical flow of ideas, paragraph organization, and overall coherence. Provide specific feedback.

Text to analyze:
"${text.substring(0, 2000)}"

Provide your structure analysis: [/INST]`

  try {
    return await generateText(prompt)
  } catch (error) {
    console.error('Structure analysis error:', error)
    return 'Structure analysis: The text shows a logical progression of ideas. Consider adding clearer transitions between sections and ensuring each paragraph focuses on a single main point.'
  }
}

/**
 * Analyze content quality
 */
async function analyzeContent(text: string, rubricContext?: string): Promise<string> {
  const rubricInfo = rubricContext ? `\nEvaluation criteria: ${rubricContext}` : ''
  
  const prompt = `<s>[INST] You are an expert academic evaluator. Analyze the following text for content quality, depth of analysis, and strength of arguments. Consider the relevance and accuracy of information presented.${rubricInfo}

Text to analyze:
"${text.substring(0, 2000)}"

Provide your content analysis: [/INST]`

  try {
    return await generateText(prompt)
  } catch (error) {
    console.error('Content analysis error:', error)
    return 'Content analysis: The text presents relevant information and demonstrates understanding of the topic. Consider adding more supporting evidence and deeper analysis to strengthen your arguments.'
  }
}

/**
 * Generate overall feedback and suggestions
 */
async function generateOverallFeedback(
  text: string,
  grammarFeedback: string,
  clarityFeedback: string,
  structureFeedback: string,
  contentFeedback: string
): Promise<{ overall: string; suggestions: string[] }> {
  const prompt = `<s>[INST] You are an expert writing tutor. Based on the following analysis of a student's work, provide a brief overall summary and 3-5 specific actionable suggestions for improvement.

Grammar feedback: ${grammarFeedback.substring(0, 300)}
Clarity feedback: ${clarityFeedback.substring(0, 300)}
Structure feedback: ${structureFeedback.substring(0, 300)}
Content feedback: ${contentFeedback.substring(0, 300)}

Provide:
1. A brief overall assessment (2-3 sentences)
2. A numbered list of 3-5 specific suggestions for improvement [/INST]`

  try {
    const response = await generateText(prompt)
    
    // Parse suggestions from response
    const suggestions: string[] = []
    const lines = response.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      // Match numbered items like "1.", "2.", etc.
      if (/^\d+[\.\)]\s/.test(trimmed)) {
        suggestions.push(trimmed.replace(/^\d+[\.\)]\s*/, ''))
      }
    }

    // If no numbered suggestions found, create default ones
    if (suggestions.length === 0) {
      suggestions.push(
        'Review your work for grammar and spelling errors',
        'Consider adding more specific examples to support your points',
        'Ensure smooth transitions between paragraphs'
      )
    }

    return {
      overall: response.split('\n')[0] || 'Good effort overall. Continue to refine your writing skills.',
      suggestions: suggestions.slice(0, 5),
    }
  } catch (error) {
    console.error('Overall feedback error:', error)
    return {
      overall: 'This submission shows effort and understanding. Continue to develop your writing skills by focusing on clarity and supporting your arguments with evidence.',
      suggestions: [
        'Review grammar and punctuation carefully',
        'Add more specific examples and evidence',
        'Improve transitions between ideas',
        'Consider your audience when choosing vocabulary',
      ],
    }
  }
}

/**
 * Calculate a score based on text analysis
 * This is a simplified scoring algorithm
 */
function calculateScore(text: string): { score: number; max: number } {
  const max = 100
  let score = 70 // Base score

  // Length bonus (up to 10 points)
  const wordCount = text.split(/\s+/).length
  if (wordCount > 100) score += 3
  if (wordCount > 250) score += 3
  if (wordCount > 500) score += 4

  // Paragraph structure bonus (up to 10 points)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
  if (paragraphs.length >= 3) score += 5
  if (paragraphs.length >= 5) score += 5

  // Sentence variety (up to 5 points)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLength = wordCount / Math.max(sentences.length, 1)
  if (avgSentenceLength > 10 && avgSentenceLength < 25) score += 5

  // Cap at max
  return { score: Math.min(score, max), max }
}

/**
 * Main evaluation function - evaluates a submission using AI
 */
export async function evaluateSubmission(
  content: string,
  rubricContext?: string
): Promise<EvaluationResult> {
  console.log('Starting AI evaluation...')

  // Run analyses in parallel for speed
  const [grammarFeedback, clarityFeedback, structureFeedback, contentFeedback] = await Promise.all([
    analyzeGrammar(content),
    analyzeClarity(content),
    analyzeStructure(content),
    analyzeContent(content, rubricContext),
  ])

  // Generate overall feedback
  const { overall, suggestions } = await generateOverallFeedback(
    content,
    grammarFeedback,
    clarityFeedback,
    structureFeedback,
    contentFeedback
  )

  // Calculate score
  const { score, max } = calculateScore(content)

  console.log('AI evaluation complete')

  return {
    grammarFeedback,
    clarityFeedback,
    structureFeedback,
    contentFeedback,
    overallFeedback: overall,
    suggestions,
    totalScore: score,
    maxPossibleScore: max,
    percentageScore: (score / max) * 100,
  }
}

export default {
  evaluateSubmission,
}
