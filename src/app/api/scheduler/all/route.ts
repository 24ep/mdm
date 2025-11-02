import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllSchedules } from '@/lib/unified-scheduler'

/**
 * Get all schedules across workflows, notebooks, and data syncs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('space_id') || undefined

    const schedules = await getAllSchedules(spaceId)

    return NextResponse.json({
      success: true,
      schedules,
      counts: {
        workflows: schedules.filter((s) => s.type === 'workflow').length,
        notebooks: schedules.filter((s) => s.type === 'notebook').length,
        data_syncs: schedules.filter((s) => s.type === 'data_sync').length
      }
    })
  } catch (error: any) {
    console.error('Error fetching all schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

