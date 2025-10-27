import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {
      deletedAt: null
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Get titles with pagination using Prisma
    const [titles, total] = await Promise.all([
      db.title.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true
        },
        orderBy: {
          name: 'asc'
        },
        skip,
        take: limit
      }),
      db.title.count({ where })
    ])

    return NextResponse.json({
      titles: titles || [],
      pagination: { page, limit, total: total || 0, pages: Math.ceil((total || 0) / limit) },
    })
  } catch (error) {
    console.error('Error fetching titles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


