'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Loader2, FileText, Palette, Camera } from 'lucide-react'
import Image from 'next/image'
import { TabNavigation } from '@/components/TabNavigation'
import { ImageUpload } from '@/components/ImageUpload'

interface ExtractionResult {
  designTokens?: any
  componentSpecs: any
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'figma' | 'screenshot'>('figma')
  const [fileKey, setFileKey] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExtractFromFigma = async () => {
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

  const handleExtractFromImage = async () => {
    if (!selectedImage) {
      setError('Please select an image')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedImage)

      const response = await fetch('/api/extract-from-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image')
      }

      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (tab: 'figma' | 'screenshot') => {
    setActiveTab(tab)
    setError(null)
    setResult(null)
  }

  const handleImageSelect = (file: File) => {
    setSelectedImage(file)
    setError(null)
  }

  const handleImageRemove = () => {
    setSelectedImage(null)
    setError(null)
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
                Extract design tokens and component specs from Figma files or screenshots
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            disabled={isLoading}
          />
        </div>

        {/* Extraction Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {activeTab === 'figma' ? (
                <>
                  <FileText className="h-5 w-5" />
                  Extract from Figma
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  Analyze Components
                </>
              )}
            </CardTitle>
            <CardDescription>
              {activeTab === 'figma'
                ? 'Enter your Figma file key to extract design tokens and component specifications'
                : 'Upload a design screenshot to analyze component styling and generate specifications using AI'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTab === 'figma' ? (
              <>
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
                <Button
                  onClick={handleExtractFromFigma}
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
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Design Screenshot</Label>
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    selectedImage={selectedImage}
                    onImageRemove={handleImageRemove}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleExtractFromImage}
                  disabled={isLoading || !selectedImage}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Analyze Components with AI
                    </>
                  )}
                </Button>
              </>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className={`grid gap-6 ${result.designTokens ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
            {/* Design Tokens - Only show for Figma extraction */}
            {result.designTokens && (
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
            )}

            {/* Component Specs */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {result.designTokens ? 'Component Specs' : 'Component Analysis'}
                    {result.componentSpecs.metadata?.source === 'ai-analysis' && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        AI Generated
                      </span>
                    )}
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

        {/* Download All Button - Only show for Figma extraction (multiple files) */}
        {result && result.designTokens && (
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
