import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const includeAssets = searchParams.get('includeAssets') === 'true'

    const where: any = {
      deletedAt: null,
    }

    if (category) {
      where.category = category
    }

    const assetTypes = await prisma.assetType.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: includeAssets
        ? {
            assets: {
              where: { deletedAt: null },
              orderBy: { sortOrder: 'asc' },
            },
          }
        : false,
    })

    return NextResponse.json(assetTypes)
  } catch (error) {
    console.error('Error fetching asset types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset types' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, description, category, sortOrder, metadata } = body

    if (!code || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const assetType = await prisma.assetType.create({
      data: {
        code,
        name,
        description,
        category,
        sortOrder: sortOrder || 0,
        metadata: metadata || {},
      },
    })

    return NextResponse.json(assetType)
  } catch (error: any) {
    console.error('Error creating asset type:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Asset type code already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create asset type' },
      { status: 500 }
    )
  }
}

