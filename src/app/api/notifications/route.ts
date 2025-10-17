import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { NotificationFilters, CreateNotificationRequest } from '@/types/notifications';

// GET /api/notifications - Get notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters: NotificationFilters = {
      type: searchParams.get('type') as any,
      status: searchParams.get('status') as any,
      priority: searchParams.get('priority') as any,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      search: searchParams.get('search') || undefined,
    };

    // Build the query
    let whereConditions = ['user_id = $1'];
    let queryParams: any[] = [session.user.id];
    let paramIndex = 2;

    if (filters.type) {
      whereConditions.push(`type = $${paramIndex}`);
      queryParams.push(filters.type);
      paramIndex++;
    }

    if (filters.status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(filters.status);
      paramIndex++;
    }

    if (filters.priority) {
      whereConditions.push(`priority = $${paramIndex}`);
      queryParams.push(filters.priority);
      paramIndex++;
    }

    if (filters.search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`);
      queryParams.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Add expiration filter
    whereConditions.push(`(expires_at IS NULL OR expires_at > NOW())`);

    const whereClause = whereConditions.join(' AND ');

    // Get notifications
    const notificationsQuery = `
      SELECT 
        id, user_id, type, priority, status, title, message, data, 
        action_url, action_label, expires_at, read_at, created_at, updated_at
      FROM public.notifications 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(filters.limit, filters.offset);

    const { rows: notifications } = await query(notificationsQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM public.notifications 
      WHERE ${whereClause}
    `;

    const { rows: countRows } = await query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countRows[0].total);

    // Get unread count
    const unreadCountQuery = `
      SELECT COUNT(*) as unread
      FROM public.notifications 
      WHERE user_id = $1 AND status = 'UNREAD' AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const { rows: unreadRows } = await query(unreadCountQuery, [session.user.id]);
    const unreadCount = parseInt(unreadRows[0].unread);

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      hasMore: filters.offset + filters.limit < total,
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateNotificationRequest = await request.json();
    const {
      user_id,
      type,
      title,
      message,
      priority = 'MEDIUM',
      data,
      action_url,
      action_label,
      expires_at,
    } = body;

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has permission to create notifications for this user
    // For now, users can only create notifications for themselves
    if (user_id !== session.user.id && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Create notification using the database function
    const createNotificationQuery = `
      SELECT create_notification($1, $2, $3, $4, $5, $6, $7, $8, $9) as notification_id
    `;

    const { rows } = await query(createNotificationQuery, [
      user_id,
      type,
      title,
      message,
      priority,
      data ? JSON.stringify(data) : null,
      action_url,
      action_label,
      expires_at,
    ]);

    const notificationId = rows[0].notification_id;

    // Fetch the created notification
    const fetchQuery = `
      SELECT 
        id, user_id, type, priority, status, title, message, data, 
        action_url, action_label, expires_at, read_at, created_at, updated_at
      FROM public.notifications 
      WHERE id = $1
    `;

    const { rows: notificationRows } = await query(fetchQuery, [notificationId]);

    return NextResponse.json(notificationRows[0], { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
