import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const environments = await prisma.apiEnvironment.findMany({
      where: {
        workspaceId,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ environments })
  } catch (error) {
    console.error('Error fetching environments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch environments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, name, variables, isGlobal } = body

    const environment = await prisma.apiEnvironment.create({
      data: {
        workspaceId,
        name,
        variables: variables || [],
        isGlobal: isGlobal || false,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ environment })
  } catch (error) {
    console.error('Error creating environment:', error)
    return NextResponse.json(
      { error: 'Failed to create environment' },
      { status: 500 }
    )
  }
}

