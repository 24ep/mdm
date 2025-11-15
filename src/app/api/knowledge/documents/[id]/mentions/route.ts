import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { extractMentionedUsers } from '@/shared/lib/knowledge/mention-parser'
import { NotificationService } from '@/lib/notification-service'

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
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Get document
    const docResult = await query(
      `SELECT kd.title, kd.collection_id, kc.is_private, kc.created_by as collection_created_by
       FROM knowledge_documents kd
       JOIN knowledge_collections kc ON kc.id = kd.collection_id
       WHERE kd.id = $1 AND kd.deleted_at IS NULL`,
      [documentId]
    )

    if (docResult.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const doc = docResult.rows[0]

    // Parse mentions
    const mentionedUsers = extractMentionedUsers(content)

    if (mentionedUsers.length === 0) {
      return NextResponse.json({ mentions: [] })
    }

    // Find users by name or email
    const usersResult = await query(
      `SELECT id, name, email FROM users 
       WHERE LOWER(name) = ANY($1::text[]) 
       OR LOWER(email) = ANY($1::text[])
       OR LOWER(name) LIKE ANY($2::text[])`,
      [
        mentionedUsers.map(u => u.toLowerCase()),
        mentionedUsers.map(u => `%${u.toLowerCase()}%`),
      ]
    )

    const foundUsers = usersResult.rows
    const notificationService = NotificationService.getInstance()

    // Create mentions and send notifications
    const createdMentions = []
    for (const user of foundUsers) {
      // Check if mention already exists
      const existing = await query(
        `SELECT id FROM knowledge_mentions 
         WHERE document_id = $1 AND user_id = $2`,
        [documentId, user.id]
      )

      if (existing.rows.length === 0) {
        // Create mention
        await query(
          `INSERT INTO knowledge_mentions (id, document_id, user_id, created_by, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
          [documentId, user.id, session.user.id]
        )

        // Send notification
        await notificationService.createNotification(
          user.id,
          'INFO',
          'You were mentioned',
          `${session.user.name} mentioned you in "${doc.title}"`,
          'MEDIUM',
          {
            documentId,
            mentionedBy: session.user.id,
          },
          `/knowledge/documents/${documentId}`
        )

        createdMentions.push({
          userId: user.id,
          userName: user.name,
          email: user.email,
        })
      }
    }

    return NextResponse.json({ mentions: createdMentions })
  } catch (error) {
    console.error('Error processing mentions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

