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
    const languageCode = searchParams.get('languageCode')
    const languageId = searchParams.get('languageId')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    const where: any = {}

    if (languageCode) {
      const language = await prisma.language.findUnique({
        where: { code: languageCode },
      })
      if (language) {
        where.languageId = language.id
      }
    } else if (languageId) {
      where.languageId = languageId
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (entityId) {
      where.entityId = entityId
    }

    const localizations = await prisma.localization.findMany({
      where,
      include: {
        language: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(localizations)
  } catch (error) {
    console.error('Error fetching localizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch localizations' },
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
    const { languageCode, languageId, entityType, entityId, field, value } = body

    if (!entityType || !entityId || !field || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let finalLanguageId = languageId
    if (languageCode && !finalLanguageId) {
      const language = await prisma.language.findUnique({
        where: { code: languageCode },
      })
      if (!language) {
        return NextResponse.json(
          { error: 'Language not found' },
          { status: 404 }
        )
      }
      finalLanguageId = language.id
    }

    if (!finalLanguageId) {
      return NextResponse.json(
        { error: 'Missing languageId or languageCode' },
        { status: 400 }
      )
    }

    const localization = await prisma.localization.upsert({
      where: {
        languageId_entityType_entityId_field: {
          languageId: finalLanguageId,
          entityType,
          entityId,
          field,
        },
      },
      update: {
        value,
      },
      create: {
        languageId: finalLanguageId,
        entityType,
        entityId,
        field,
        value,
      },
      include: {
        language: true,
      },
    })

    return NextResponse.json(localization)
  } catch (error) {
    console.error('Error creating/updating localization:', error)
    return NextResponse.json(
      { error: 'Failed to save localization' },
      { status: 500 }
    )
  }
}

