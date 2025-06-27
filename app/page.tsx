'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Loader2, FileText, Palette } from 'lucide-react'
import Image from 'next/image'

interface ExtractionResult {
  designTokens: any
  componentSpecs: any
}

export default function Home() {
  const [fileKey, setFileKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExtract = async () => {
    if (!fileKey.trim()) {
      setError('Please enter a Figma file key')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileKey: fileKey.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract data')
      }

      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadFile = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header with Logo */}
        <div className="py-8 mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Image
              src="/logo.svg"
              alt="Figma Design Extractor"
              width={64}
              height={64}
              className="rounded-lg shadow-lg"
            />
            <div>
              <h1 className="text-4xl font-bold text-slate-900">
                Figma Design Extractor
              </h1>
              <p className="text-lg text-slate-600 mt-2">
                Extract design tokens and component specs from Figma files
              </p>
            </div>
          </div>
        </div>

        {/* Extraction Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Extract Design Data
            </CardTitle>
            <CardDescription>
              Enter your Figma file key to extract design tokens and component specifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileKey">Figma File Key</Label>
              <Input
                id="fileKey"
                placeholder="e.g., abc123def456..."
                value={fileKey}
                onChange={(e) => setFileKey(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button
              onClick={handleExtract}
              disabled={isLoading || !fileKey.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Palette className="mr-2 h-4 w-4" />
                  Extract Design Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Design Tokens */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Design Tokens
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(result.designTokens, 'design-tokens.json')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-slate-50 p-4 rounded-md overflow-auto max-h-96">
                  {JSON.stringify(result.designTokens, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Component Specs */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Component Specs
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(result.componentSpecs, 'component-specs.json')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-slate-50 p-4 rounded-md overflow-auto max-h-96">
                  {JSON.stringify(result.componentSpecs, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Download All Button */}
        {result && (
          <div className="mt-6 text-center">
            <Button
              onClick={() => {
                downloadFile(result.designTokens, 'design-tokens.json')
                downloadFile(result.componentSpecs, 'component-specs.json')
              }}
              size="lg"
              className="shadow-lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Download All Files
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
