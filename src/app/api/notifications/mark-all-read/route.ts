import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

// POST /api/notifications/mark-all-read - Mark all notifications as read for the current user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the database function to mark all notifications as read
    const markAllReadQuery = `
      SELECT mark_all_notifications_read($1) as updated_count
    `;

    const { rows } = await query(markAllReadQuery, [session.user.id]);
    const updatedCount = parseInt(rows[0].updated_count);

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Marked ${updatedCount} notifications as read`,
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
