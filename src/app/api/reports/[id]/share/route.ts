import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import crypto from 'crypto'
import { auditLogger } from '@/lib/utils/audit-logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { password, expires_at, max_views } = body

    // Check if user owns the report
    const ownerCheck = await query(
      'SELECT created_by FROM reports WHERE id = $1',
      [params.id]
    )

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (ownerCheck.rows[0].created_by !== session.user.id) {
      return NextResponse.json({ error: 'Only report owner can create share links' }, { status: 403 })
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')
    const passwordHash = password ? crypto.createHash('sha256').update(password).digest('hex') : null

    const sql = `
      INSERT INTO report_share_links (
        report_id, token, password_hash, expires_at, max_views, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `

    const result = await query<any>(sql, [
      params.id,
      token,
      passwordHash,
      expires_at ? new Date(expires_at) : null,
      max_views || null,
      session.user.id
    ])

    // Log audit event
    auditLogger.reportShared(params.id, result.rows[0].id)

    return NextResponse.json({ token, shareLink: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating share link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sql = `
      SELECT * FROM report_share_links
      WHERE report_id = $1 AND created_by = $2 AND is_active = true
      ORDER BY created_at DESC
    `

    const result = await query<any>(sql, [params.id, session.user.id])

    return NextResponse.json({ links: result.rows || [] })
  } catch (error) {
    console.error('Error fetching share links:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

