import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' })
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File
    const assetId = formData.get('assetId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' })
    }

    // Validate file size (max ~2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' })
    }

    const uploadsDir = join(process.cwd(), 'uploads', 'assets', 'logos')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const fileExtension = (file.name.split('.').pop() || 'png').toLowerCase()
    const filename = assetId
      ? `asset-${assetId}-${timestamp}.${fileExtension}`
      : `logo-${timestamp}.${fileExtension}`
    const filepath = join(uploadsDir, filename)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/assets/logos/${filename}`
    return NextResponse.json({ success: true, url: publicUrl, filename })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/assets/upload-logo')
