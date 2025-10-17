import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

// POST /api/notifications/cleanup - Clean up expired notifications
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to cleanup notifications
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Use the database function to cleanup expired notifications
    const cleanupQuery = `
      SELECT cleanup_expired_notifications() as cleaned_count
    `;

    const { rows } = await query(cleanupQuery);
    const cleanedCount = parseInt(rows[0].cleaned_count);

    return NextResponse.json({
      success: true,
      cleanedCount,
      message: `Cleaned up ${cleanedCount} expired notifications`,
    });

  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup notifications' },
      { status: 500 }
    );
  }
}
