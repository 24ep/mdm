import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { UpdateNotificationRequest } from '@/types/notifications';

// GET /api/notifications/[id] - Get a specific notification
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const fetchQuery = `
      SELECT 
        id, user_id, type, priority, status, title, message, data, 
        action_url, action_label, expires_at, read_at, created_at, updated_at
      FROM public.notifications 
      WHERE id = $1 AND user_id = $2
    `;

    const { rows } = await query(fetchQuery, [id, session.user.id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);

  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/[id] - Update a notification
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body: UpdateNotificationRequest = await request.json();

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (body.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(body.status);
      paramIndex++;
    }

    if (body.read_at !== undefined) {
      updateFields.push(`read_at = $${paramIndex}`);
      updateValues.push(body.read_at);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add user_id and id to the query
    updateValues.push(session.user.id, id);

    const updateQuery = `
      UPDATE public.notifications 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex + 1} AND user_id = $${paramIndex}
      RETURNING 
        id, user_id, type, priority, status, title, message, data, 
        action_url, action_label, expires_at, read_at, created_at, updated_at
    `;

    const { rows } = await query(updateQuery, updateValues);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const deleteQuery = `
      DELETE FROM public.notifications 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const { rows } = await query(deleteQuery, [id, session.user.id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
