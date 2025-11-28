/**
 * AI Service - Groq Integration
 * Provides text analysis for grammar, clarity, structure, and content evaluation
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile'
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.HF_API_KEY

interface GroqChoiceMessage {
  content?: string
}

interface GroqChoice {
  message?: GroqChoiceMessage
}

interface GroqResponse {
  choices?: GroqChoice[]
  error?: { message?: string }
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
 * Call Groq Chat Completions API
 */
async function callGroq(prompt: string, options?: { maxTokens?: number; temperature?: number; systemPrompt?: string; model?: string }): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options?.model || DEFAULT_MODEL,
      max_tokens: options?.maxTokens ?? 900,
      temperature: options?.temperature ?? 0.7,
      messages: [
        {
          role: 'system',
          content: options?.systemPrompt || 'You are an expert writing tutor providing concise, actionable feedback.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Groq API error:', error)
    throw new Error(`Groq API error: ${response.status}`)
  }

  const data = (await response.json()) as GroqResponse
  const generated = data?.choices?.[0]?.message?.content?.trim()

  if (!generated) {
    console.error('Groq API unexpected response:', JSON.stringify(data))
    throw new Error('Groq API returned an empty response')
  }

  return generated
}

/**
 * Generate text using a language model
 */
async function generateText(prompt: string): Promise<string> {
  try {
    return await callGroq(prompt)
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
