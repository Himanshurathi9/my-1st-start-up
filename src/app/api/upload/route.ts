import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'

// POST: Upload image to Cloudinary (auth required)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Whitelist allowed folder values to prevent path traversal
    const ALLOWED_FOLDERS = ['menu-items', 'banners', 'logos', 'general']
    const safeFolder = ALLOWED_FOLDERS.includes(folder) ? folder : 'general'

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 })
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Cloudinary
    const publicId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const url = await uploadToCloudinary(buffer, safeFolder, publicId)

    return NextResponse.json({
      success: true,
      url,
      public_id: `menumate/${safeFolder}/${publicId}`,
    })
  } catch (error) {
    console.error('[Upload] Upload failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    )
  }
}

// DELETE: Delete image from Cloudinary (auth required)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { public_id } = body as { public_id: string }

    if (!public_id) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 })
    }

    await deleteFromCloudinary(public_id)

    return NextResponse.json({ success: true, message: 'Image deleted' })
  } catch (error) {
    console.error('[Upload] Delete failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 },
    )
  }
}
