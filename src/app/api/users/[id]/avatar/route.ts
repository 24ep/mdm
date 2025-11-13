import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// POST /api/users/[id]/avatar - upload user avatar
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can update this profile (own profile or MANAGER+)
    const isOwnProfile = session.user.id === params.id
    const isManager = session.user.role && ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    
    if (!isOwnProfile && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Check if user exists
    const userResult = await query(
      'SELECT id, email, name, avatar FROM users WHERE id = $1',
      [params.id]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `avatar_${params.id}_${Date.now()}.${fileExtension}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const filePath = join(uploadsDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update user avatar in database
    const avatarUrl = `/uploads/avatars/${fileName}`
    await query(
      'UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2',
      [avatarUrl, params.id]
    )

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'User',
      entityId: params.id,
      oldValue: { avatar: user.avatar },
      newValue: { avatar: avatarUrl },
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      // description: `Avatar updated for user ${user.email}`
    })

    return NextResponse.json({ 
      success: true, 
      avatar: avatarUrl,
      message: 'Avatar uploaded successfully' 
    })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id]/avatar - set avatar from URL (library selection)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can update this profile (own profile or MANAGER+)
    const isOwnProfile = session.user.id === params.id
    const isManager = session.user.role && ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    
    if (!isOwnProfile && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { avatarUrl } = body

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json({ error: 'Avatar URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(avatarUrl)
    } catch {
      // If not a full URL, check if it's a relative path
      if (!avatarUrl.startsWith('/') && !avatarUrl.startsWith('./')) {
        return NextResponse.json({ error: 'Invalid avatar URL format' }, { status: 400 })
      }
    }

    // Check if user exists
    const userResult = await query(
      'SELECT id, email, name, avatar FROM users WHERE id = $1',
      [params.id]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Update user avatar in database
    await query(
      'UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2',
      [avatarUrl, params.id]
    )

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'User',
      entityId: params.id,
      oldValue: { avatar: user.avatar },
      newValue: { avatar: avatarUrl },
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      // description: `Avatar updated from library for user ${user.email}`
    })

    return NextResponse.json({ 
      success: true, 
      avatar: avatarUrl,
      message: 'Avatar set successfully' 
    })
  } catch (error) {
    console.error('Error setting avatar:', error)
    return NextResponse.json(
      { error: 'Failed to set avatar' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id]/avatar - remove user avatar
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can update this profile (own profile or MANAGER+)
    const isOwnProfile = session.user.id === params.id
    const isManager = session.user.role && ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    
    if (!isOwnProfile && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user exists and get current avatar
    const userResult = await query(
      'SELECT id, email, name, avatar FROM users WHERE id = $1',
      [params.id]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Remove avatar from database
    await query(
      'UPDATE users SET avatar = NULL, updated_at = NOW() WHERE id = $1',
      [params.id]
    )

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'User',
      entityId: params.id,
      oldValue: { avatar: user.avatar },
      newValue: { avatar: null },
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      // description: `Avatar removed for user ${user.email}`
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Avatar removed successfully' 
    })
  } catch (error) {
    console.error('Error removing avatar:', error)
    return NextResponse.json(
      { error: 'Failed to remove avatar' },
      { status: 500 }
    )
  }
}
