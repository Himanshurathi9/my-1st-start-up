'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Loader2, Pencil } from 'lucide-react'
import { handleImgError } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  onUpload: (url: string) => void
  folder?: string
  currentImage?: string | null
  label?: string
  aspectRatio?: 'square' | 'wide'
}

function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export default function ImageUpload({
  onUpload,
  folder = 'general',
  currentImage,
  label = 'Add Photo',
  aspectRatio = 'square',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploading(true)
    try {
      // Client-side compression
      const compressedDataUrl = await compressImage(file, 1200, 0.85)

      // Convert data URL to Blob
      const res = await fetch(compressedDataUrl)
      const blob = await res.blob()

      const formData = new FormData()
      formData.append('file', blob, file.name)
      formData.append('folder', folder)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const json = await uploadRes.json()

      if (!uploadRes.ok || !json.success) {
        toast.error('Upload failed, try again')
        return
      }

      onUpload(json.url)
      toast.success('Photo uploaded')
    } catch {
      toast.error('Upload failed, try again')
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [folder, onUpload])

  const aspectClass = aspectRatio === 'wide' ? 'aspect-[4/3]' : 'aspect-square'

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`w-full ${aspectClass} rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 transition-all hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 relative overflow-hidden min-h-[100px] ${
          currentImage ? 'border-solid border-gray-100' : ''
        }`}
      >
        {currentImage ? (
          <>
            <img
              src={currentImage}
              alt="Menu item"
              className="absolute inset-0 w-full h-full object-cover rounded-xl"
              onError={handleImgError}
            />
            {/* Edit overlay */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="opacity-0 hover:opacity-100 transition-opacity bg-white rounded-full p-2 shadow-lg">
                <Pencil className="w-4 h-4 text-gray-700" />
              </div>
            </div>
          </>
        ) : (
          <>
            <Camera className="w-6 h-6 text-gray-300" />
            <span className="text-xs text-gray-400 font-medium">{label}</span>
          </>
        )}

        {/* Uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        )}
      </button>
    </div>
  )
}
