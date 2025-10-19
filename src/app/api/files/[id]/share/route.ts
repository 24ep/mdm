import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import crypto from 'crypto'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Implement your authentication system here
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fileId = params.id

    // Check if user has access to this file
    const accessResult = await query(
      `SELECT af.space_id, af.file_name, af.mime_type, af.file_size
       FROM attachment_files af
       JOIN space_members sm ON af.space_id = sm.space_id
       WHERE af.id = $1 AND sm.user_id = $2 AND sm.role IN ('owner', 'admin', 'member')`,
      [fileId, userId]
    )

    if (accessResult.rows.length === 0) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
    }

    // Get all shares for this file
    const sharesResult = await query(
      `SELECT 
        fs.id,
        fs.shared_with,
        fs.permission_level,
        fs.is_public,
        fs.expires_at,
        fs.access_count,
        fs.last_accessed_at,
        fs.created_at,
        u.name as shared_by_name
       FROM file_shares fs
       LEFT JOIN users u ON fs.shared_by = u.id
       WHERE fs.file_id = $1
       ORDER BY fs.created_at DESC`,
      [fileId]
    )

    return NextResponse.json({
      file: accessResult.rows[0],
      shares: sharesResult.rows
    })

  } catch (error) {
    console.error('Error fetching file shares:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Implement your authentication system here
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fileId = params.id
    const { 
      sharedWith, 
      permissionLevel = 'view', 
      isPublic = false, 
      password, 
      expiresAt 
    } = await request.json()

    // Check if user has access to this file
    const accessResult = await query(
      `SELECT af.space_id, af.file_name
       FROM attachment_files af
       JOIN space_members sm ON af.space_id = sm.space_id
       WHERE af.id = $1 AND sm.user_id = $2 AND sm.role IN ('owner', 'admin', 'member')`,
      [fileId, userId]
    )

    if (accessResult.rows.length === 0) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
    }

    // Validate permission level
    if (!['view', 'download', 'edit'].includes(permissionLevel)) {
      return NextResponse.json({ error: 'Invalid permission level' }, { status: 400 })
    }

    // Hash password if provided
    let passwordHash = null
    if (password) {
      passwordHash = crypto.createHash('sha256').update(password).digest('hex')
    }

    // Create share
    const shareResult = await query(
      `INSERT INTO file_shares 
       (file_id, shared_by, shared_with, permission_level, is_public, password_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        fileId,
        userId,
        sharedWith,
        permissionLevel,
        isPublic,
        passwordHash,
        expiresAt ? new Date(expiresAt) : null
      ]
    )

    return NextResponse.json({
      share: shareResult.rows[0]
    })

  } catch (error) {
    console.error('Error creating file share:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Implement your authentication system here
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fileId = params.id
    const { searchParams } = new URL(request.url)
    const shareId = searchParams.get('shareId')

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 })
    }

    // Check if user can delete this share
    const shareResult = await query(
      `SELECT fs.id, fs.shared_by
       FROM file_shares fs
       JOIN attachment_files af ON fs.file_id = af.id
       JOIN space_members sm ON af.space_id = sm.space_id
       WHERE fs.id = $1 AND (fs.shared_by = $2 OR sm.user_id = $2 AND sm.role IN ('owner', 'admin'))`,
      [shareId, userId]
    )

    if (shareResult.rows.length === 0) {
      return NextResponse.json({ error: 'Share not found or access denied' }, { status: 404 })
    }

    // Delete the share
    await query('DELETE FROM file_shares WHERE id = $1', [shareId])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting file share:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
