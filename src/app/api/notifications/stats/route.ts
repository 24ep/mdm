import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/notifications/stats - Get notification statistics for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total count
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM public.notifications 
      WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const { rows: totalRows } = await query(totalQuery, [session.user.id]);
    const total = parseInt(totalRows[0].total);

    // Get unread count
    const unreadQuery = `
      SELECT COUNT(*) as unread
      FROM public.notifications 
      WHERE user_id = $1 AND status = 'UNREAD' AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const { rows: unreadRows } = await query(unreadQuery, [session.user.id]);
    const unread = parseInt(unreadRows[0].unread);

    // Get count by type
    const byTypeQuery = `
      SELECT type, COUNT(*) as count
      FROM public.notifications 
      WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
      GROUP BY type
    `;

    const { rows: typeRows } = await query(byTypeQuery, [session.user.id]);
    const byType = typeRows.reduce((acc, row) => {
      acc[row.type] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Get count by priority
    const byPriorityQuery = `
      SELECT priority, COUNT(*) as count
      FROM public.notifications 
      WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
      GROUP BY priority
    `;

    const { rows: priorityRows } = await query(byPriorityQuery, [session.user.id]);
    const byPriority = priorityRows.reduce((acc, row) => {
      acc[row.priority] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      total,
      unread,
      by_type: byType,
      by_priority: byPriority,
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification stats' },
      { status: 500 }
    );
  }
}
