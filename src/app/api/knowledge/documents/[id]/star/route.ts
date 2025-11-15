import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId } = await params

    // Check if already starred
    const existing = await query(
      `SELECT id FROM knowledge_stars WHERE document_id = $1 AND user_id = $2`,
      [documentId, session.user.id]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json({ starred: true })
    }

    // Create star
    await query(
      `INSERT INTO knowledge_stars (id, document_id, user_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, NOW())`,
      [documentId, session.user.id]
    )

    return NextResponse.json({ starred: true })
  } catch (error) {
    console.error('Error starring document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId } = await params

    await query(
      `DELETE FROM knowledge_stars WHERE document_id = $1 AND user_id = $2`,
      [documentId, session.user.id]
    )

    return NextResponse.json({ starred: false })
  } catch (error) {
    console.error('Error unstarring document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId } = await params

    const result = await query(
      `SELECT id FROM knowledge_stars WHERE document_id = $1 AND user_id = $2`,
      [documentId, session.user.id]
    )

    return NextResponse.json({ starred: result.rows.length > 0 })
  } catch (error) {
    console.error('Error checking star:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

