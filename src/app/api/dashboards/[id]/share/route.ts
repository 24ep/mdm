import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { visibility, embed_enabled } = await request.json()
    const dashboardId = params.id

    // Generate a unique public link
    const publicLink = generatePublicLink()

    // Update dashboard with sharing settings
    const { data, error } = await supabase
      .from('dashboards')
      .update({
        visibility,
        embed_enabled,
        public_link: publicLink,
        updated_at: new Date().toISOString()
      })
      .eq('id', dashboardId)
      .select()
      .single()

    if (error) {
      console.error('Error updating dashboard share settings:', error)
      return NextResponse.json(
        { error: 'Failed to update share settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      public_link: publicLink,
      dashboard: data
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

    // Update dashboard with sharing settings
    const { data, error } = await supabase
      .from('dashboards')
      .update({
        visibility,
        allowed_users,
        embed_enabled,
        public_link,
        updated_at: new Date().toISOString()
      })
      .eq('id', dashboardId)
      .select()
      .single()

    if (error) {
      console.error('Error updating dashboard share settings:', error)
      return NextResponse.json(
        { error: 'Failed to update share settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      dashboard: data
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

    // Get dashboard share settings
    const { data, error } = await supabase
      .from('dashboards')
      .select('id, name, visibility, allowed_users, embed_enabled, public_link, created_by')
      .eq('id', dashboardId)
      .single()

    if (error) {
      console.error('Error fetching dashboard share settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch share settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shareSettings: data
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
