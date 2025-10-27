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
    const attributeId = searchParams.get('attributeId')
    const spaceId = searchParams.get('spaceId')

    if (!attributeId) {
      return NextResponse.json({ error: 'attributeId is required' }, { status: 400 })
    }

    // Check if user has access to this space using Prisma
    if (spaceId) {
      const spaceMember = await db.spaceMember.findFirst({
        where: {
          spaceId: spaceId,
          userId: session.user.id
        },
        select: { role: true }
      })

      if (!spaceMember) {
        return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
      }
    }

    // Get attachments for the attribute using Prisma
    const attachments = await db.attachmentFile.findMany({
      where: { attributeId: attributeId },
      include: {
        dataModelAttribute: {
          include: {
            dataModel: {
              select: { spaceId: true }
            }
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json({ attachments })

  } catch (error) {
    console.error('Error in attachments GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
