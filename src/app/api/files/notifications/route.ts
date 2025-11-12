import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause = 'WHERE user_id = $1'
    let queryParams: any[] = [userId]

    if (unreadOnly) {
      whereClause += ' AND is_read = false'
    }

    // Get notifications
    const notificationsResult = await query(
      `SELECT 
        fn.id,
        fn.type,
        fn.title,
        fn.message,
        fn.file_id,
        fn.is_read,
        fn.action_url,
        fn.metadata,
        fn.created_at,
        af.file_name,
        af.mime_type
       FROM file_notifications fn
       LEFT JOIN attachment_files af ON fn.file_id = af.id
       ${whereClause}
       ORDER BY fn.created_at DESC
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    )

    // Get unread count
    const unreadCountResult = await query(
      'SELECT COUNT(*) as count FROM file_notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    )

    return NextResponse.json({
      notifications: notificationsResult.rows,
      unreadCount: parseInt((unreadCountResult.rows[0] as any).count)
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationIds, markAllAsRead = false } = await request.json()

    if (markAllAsRead) {
      // Mark all notifications as read
      await query(
        'UPDATE file_notifications SET is_read = true WHERE user_id = $1',
        [userId]
      )
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const placeholders = notificationIds.map((_, index) => `$${index + 2}`).join(',')
      await query(
        `UPDATE file_notifications 
         SET is_read = true 
         WHERE user_id = $1 AND id IN (${placeholders})`,
        [userId, ...notificationIds]
      )
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationIds, deleteAll = false } = await request.json()

    if (deleteAll) {
      // Delete all notifications
      await query(
        'DELETE FROM file_notifications WHERE user_id = $1',
        [userId]
      )
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Delete specific notifications
      const placeholders = notificationIds.map((_, index) => `$${index + 2}`).join(',')
      await query(
        `DELETE FROM file_notifications 
         WHERE user_id = $1 AND id IN (${placeholders})`,
        [userId, ...notificationIds]
      )
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
