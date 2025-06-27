'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  selectedImage: File | null
  onImageRemove: () => void
  disabled?: boolean
}

export function ImageUpload({ onImageSelect, selectedImage, onImageRemove, disabled }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }, [disabled])

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (20MB limit for design screenshots)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      alert('File size must be less than 20MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    onImageSelect(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleRemove = () => {
    setImagePreview(null)
    onImageRemove()
  }

  if (selectedImage && imagePreview) {
    return (
      <Card className="relative">
        <CardContent className="p-6">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 z-10"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-slate-50">
              <Image
                src={imagePreview}
                alt="Upload preview"
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-4 text-sm text-slate-600">
              <p><strong>File:</strong> {selectedImage.name}</p>
              <p><strong>Size:</strong> {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`relative border-2 border-dashed transition-colors ${
        dragActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-slate-300 hover:border-slate-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CardContent className="p-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <ImageIcon className="h-8 w-8 text-slate-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-slate-900">
              Upload Screenshot
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Drag and drop your design screenshot here, or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-400">
              PNG, JPG, WebP up to 20MB
            </p>
          </div>
          <div className="mt-6">
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleInputChange}
              disabled={disabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
