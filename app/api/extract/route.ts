import { NextRequest, NextResponse } from 'next/server'
import { ExtractorService } from '@/src/services/extractor'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileKey } = body

    if (!fileKey) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      )
    }

    // Initialize the extractor service
    const extractor = new ExtractorService()

    // Extract data - using the new method that returns data
    const result = await extractor.extractDataFromFigma(fileKey)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Extraction error:', error)
    return NextResponse.json(
      {
        error: 'Failed to extract data from Figma',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
