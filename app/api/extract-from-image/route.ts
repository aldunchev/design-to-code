import { NextRequest, NextResponse } from 'next/server'
import { analyzeImageWithOpenAI } from '@/lib/openai'
import { validateImageFile, parseJSONFromAIResponse } from '@/lib/image-utils'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate the image file
    const validation = validateImageFile(imageFile)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')

    // Load the system prompt from the markdown file
    const promptPath = join(process.cwd(), 'componets-specs-json.md')
    const systemPrompt = await readFile(promptPath, 'utf-8')

    // Analyze image with OpenAI
    const aiResponse = await analyzeImageWithOpenAI({
      imageBase64,
      systemPrompt,
      maxTokens: 4000
    })

    // Parse JSON from AI response
    let parsedJSON
    try {
      parsedJSON = parseJSONFromAIResponse(aiResponse)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json(
        {
          error: 'Failed to parse AI response as valid JSON',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
          rawResponse: aiResponse.substring(0, 500) + '...' // First 500 chars for debugging
        },
        { status: 500 }
      )
    }

    // Validate that we have the expected structure
    if (!parsedJSON || typeof parsedJSON !== 'object') {
      return NextResponse.json(
        {
          error: 'AI response is not a valid JSON object',
          rawResponse: aiResponse.substring(0, 500) + '...'
        },
        { status: 500 }
      )
    }

    // For screenshot analysis, only generate component specs (design tokens don't make sense from screenshots)
    const componentSpecs = {
      ...parsedJSON,
      metadata: {
        source: 'ai-analysis',
        timestamp: new Date().toISOString(),
        model: 'gpt-4o',
        type: 'component-specs'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        componentSpecs
      }
    })

  } catch (error) {
    console.error('Extract from image error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
