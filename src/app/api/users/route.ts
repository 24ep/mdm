import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get all users from the auth.users table
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Transform user data to include only necessary fields
    const users = data.users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    }))

    return NextResponse.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('Error in users GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}