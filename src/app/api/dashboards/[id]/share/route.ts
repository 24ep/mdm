import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { visibility, embed_enabled } = await request.json()
    const dashboardId = params.id

    // Generate a unique public link
    const publicLink = generatePublicLink()

    // Update dashboard with sharing settings using Prisma
    const dashboard = await db.dashboard.update({
      where: { id: dashboardId },
      data: {
        visibility,
        embedEnabled: embed_enabled,
        publicLink: publicLink,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      public_link: publicLink,
      dashboard: {
        id: dashboard.id,
        name: dashboard.name,
        visibility: dashboard.visibility,
        embedEnabled: dashboard.embedEnabled,
        publicLink: dashboard.publicLink,
        updatedAt: dashboard.updatedAt
      }
    })
  } catch (error) {
    console.error('Error in share POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { visibility, allowed_users, embed_enabled, public_link } = await request.json()
    const dashboardId = params.id

    // Update dashboard with sharing settings using Prisma
    const dashboard = await db.dashboard.update({
      where: { id: dashboardId },
      data: {
        visibility,
        allowedUsers: allowed_users,
        embedEnabled: embed_enabled,
        publicLink: public_link,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      dashboard: {
        id: dashboard.id,
        name: dashboard.name,
        visibility: dashboard.visibility,
        allowedUsers: dashboard.allowedUsers,
        embedEnabled: dashboard.embedEnabled,
        publicLink: dashboard.publicLink,
        updatedAt: dashboard.updatedAt
      }
    })
  } catch (error) {
    console.error('Error in share PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dashboardId = params.id

    // Get dashboard share settings using Prisma
    const dashboard = await db.dashboard.findUnique({
      where: { id: dashboardId },
      select: {
        id: true,
        name: true,
        visibility: true,
        allowedUsers: true,
        embedEnabled: true,
        publicLink: true,
        createdBy: true
      }
    })

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      shareSettings: {
        id: dashboard.id,
        name: dashboard.name,
        visibility: dashboard.visibility,
        allowed_users: dashboard.allowedUsers,
        embed_enabled: dashboard.embedEnabled,
        public_link: dashboard.publicLink,
        created_by: dashboard.createdBy
      }
    })
  } catch (error) {
    console.error('Error in share GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generatePublicLink(): string {
  // Generate a random string for the public link
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
