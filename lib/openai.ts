import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AnalyzeImageParams {
  imageBase64: string
  systemPrompt: string
  maxTokens?: number
}

export async function analyzeImageWithOpenAI({
  imageBase64,
  systemPrompt,
  maxTokens = 4000
}: AnalyzeImageParams) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this design screenshot and generate the comprehensive JSON design system profile as specified in the system prompt."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.1, // Low temperature for consistent, precise output
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response content from OpenAI')
    }

    return content
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error(`OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
