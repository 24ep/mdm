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
    const assetTypeCode = searchParams.get('assetTypeCode')
    const assetTypeId = searchParams.get('assetTypeId')
    const isActive = searchParams.get('isActive')
    const languageCode = searchParams.get('language') // For localized names

    const where: any = {
      deletedAt: null,
    }

    if (assetTypeCode) {
      const assetType = await prisma.assetType.findUnique({
        where: { code: assetTypeCode },
      })
      if (assetType) {
        where.assetTypeId = assetType.id
      }
    } else if (assetTypeId) {
      where.assetTypeId = assetTypeId
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        assetType: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    // If language code is provided, fetch localizations
    if (languageCode && assets.length > 0) {
      const language = await prisma.language.findUnique({
        where: { code: languageCode },
      })

      if (language) {
        const assetIds = assets.map((a) => a.id)
        const localizations = await prisma.localization.findMany({
          where: {
            languageId: language.id,
            entityType: 'asset',
            entityId: { in: assetIds },
          },
        })

        // Map localizations to assets
        const localizationMap = new Map(
          localizations.map((loc) => [`${loc.entityId}-${loc.field}`, loc.value])
        )

        assets.forEach((asset) => {
          const localizedName = localizationMap.get(`${asset.id}-name`)
          const localizedDesc = localizationMap.get(`${asset.id}-description`)
          if (localizedName) asset.name = localizedName
          if (localizedDesc) asset.description = localizedDesc
        })
      }
    }

    return NextResponse.json(assets)
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
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
    const {
      assetTypeId,
      assetTypeCode,
      code,
      name,
      description,
      logo,
      icon,
      color,
      sortOrder,
      metadata,
    } = body

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: code and name' },
        { status: 400 }
      )
    }

    let finalAssetTypeId = assetTypeId
    if (assetTypeCode && !finalAssetTypeId) {
      const assetType = await prisma.assetType.findUnique({
        where: { code: assetTypeCode },
      })
      if (!assetType) {
        return NextResponse.json(
          { error: 'Asset type not found' },
          { status: 404 }
        )
      }
      finalAssetTypeId = assetType.id
    }

    if (!finalAssetTypeId) {
      return NextResponse.json(
        { error: 'Missing assetTypeId or assetTypeCode' },
        { status: 400 }
      )
    }

    const asset = await prisma.asset.create({
      data: {
        assetTypeId: finalAssetTypeId,
        code,
        name,
        description,
        logo,
        icon,
        color,
        sortOrder: sortOrder || 0,
        metadata: metadata || {},
      },
      include: {
        assetType: true,
      },
    })

    return NextResponse.json(asset)
  } catch (error: any) {
    console.error('Error creating asset:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Asset code already exists for this type' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}

