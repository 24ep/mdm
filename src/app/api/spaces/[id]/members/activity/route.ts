import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Check if user has access to this space
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get member activity data
    const activityData = await query(`
      SELECT 
        sm.user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar,
        sm.role as space_role,
        u.last_sign_in_at,
        u.is_active,
        COUNT(DISTINCT DATE(u.last_sign_in_at)) as active_days,
        MAX(u.last_sign_in_at) as last_activity
      FROM space_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1
        AND u.last_sign_in_at >= NOW() - INTERVAL '${days} days'
      GROUP BY sm.user_id, u.name, u.email, u.avatar, sm.role, u.last_sign_in_at, u.is_active
      ORDER BY last_activity DESC NULLS LAST
    `, [spaceId])

    // Get activity statistics
    const stats = await query(`
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN u.is_active THEN 1 END) as active_members,
        COUNT(CASE WHEN u.last_sign_in_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_activity,
        COUNT(CASE WHEN u.last_sign_in_at >= NOW() - INTERVAL '1 day' THEN 1 END) as today_activity,
        AVG(CASE WHEN u.last_sign_in_at >= NOW() - INTERVAL '${days} days' 
            THEN EXTRACT(EPOCH FROM (NOW() - u.last_sign_in_at))/3600 
            END) as avg_hours_since_activity
      FROM space_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1
    `, [spaceId])

    // Get daily activity for chart
    const dailyActivity = await query(`
      SELECT 
        DATE(u.last_sign_in_at) as activity_date,
        COUNT(DISTINCT u.id) as active_users
      FROM space_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1
        AND u.last_sign_in_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(u.last_sign_in_at)
      ORDER BY activity_date DESC
    `, [spaceId])

    return NextResponse.json({
      activity: activityData.rows,
      statistics: stats.rows[0],
      dailyActivity: dailyActivity.rows,
      period: days
    })
  } catch (error) {
    console.error('Error fetching member activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member activity' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId } = await params
    const body = await request.json()
    const { action, metadata } = body

    // Update user's last activity
    await query(`
      UPDATE users 
      SET last_sign_in_at = NOW()
      WHERE id = $1
    `, [session.user.id])

    // Log activity if needed
    if (action) {
      await query(`
        INSERT INTO user_activities (user_id, space_id, action, metadata, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [session.user.id, spaceId, action, JSON.stringify(metadata || {})])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    )
  }
}
