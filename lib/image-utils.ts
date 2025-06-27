export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to convert file to base64'))
    reader.readAsDataURL(file)
  })
}

export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image' }
  }

  // Check supported formats
  const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!supportedTypes.includes(file.type)) {
    return { isValid: false, error: 'Supported formats: PNG, JPG, WebP' }
  }

  // Check file size (20MB limit)
  const maxSize = 20 * 1024 * 1024 // 20MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 20MB' }
  }

  return { isValid: true }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function parseJSONFromAIResponse(content: string): any {
  try {
    // Try to parse the content directly first
    return JSON.parse(content)
  } catch {
    // If that fails, try to extract JSON from code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1])
      } catch {
        throw new Error('Invalid JSON format in AI response')
      }
    }

    // Try to find JSON-like content without code blocks
    const jsonStart = content.indexOf('{')
    const jsonEnd = content.lastIndexOf('}')

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(content.slice(jsonStart, jsonEnd + 1))
      } catch {
        throw new Error('Could not parse JSON from AI response')
      }
    }

    throw new Error('No valid JSON found in AI response')
  }
}
