import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, variables, isGlobal } = body

    const environment = await prisma.apiEnvironment.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(variables !== undefined && { variables }),
        ...(isGlobal !== undefined && { isGlobal }),
      },
    })

    return NextResponse.json({ environment })
  } catch (error) {
    console.error('Error updating environment:', error)
    return NextResponse.json(
      { error: 'Failed to update environment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.apiEnvironment.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting environment:', error)
    return NextResponse.json(
      { error: 'Failed to delete environment' },
      { status: 500 }
    )
  }
}

