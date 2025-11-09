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

    const environments = await prisma.apiClientEnvironment.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ environments })
  } catch (error) {
    console.error('Error loading environments:', error)
    return NextResponse.json(
      { error: 'Failed to load environments' },
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

    const { name, variables, isActive } = await request.json()
    
    // If setting as active, deactivate others
    if (isActive) {
      await prisma.apiClientEnvironment.updateMany({
        where: { userId: session.user.id, isActive: true },
        data: { isActive: false }
      })
    }

    const environment = await prisma.apiClientEnvironment.create({
      data: {
        userId: session.user.id,
        name,
        variables: variables || [],
        isActive: isActive || false
      }
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

