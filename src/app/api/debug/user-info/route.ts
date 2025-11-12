import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Also check what users exist in the database
    let dbUsers = []
    try {
      const result = await query('SELECT id, email, name, role, is_active FROM public.users LIMIT 5')
      dbUsers = result.rows
    } catch (dbError) {
      console.error('Database query error:', dbError)
    }
    
    return NextResponse.json({
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      hasSession: !!session,
      userRole: session?.user?.role || 'No role',
      userId: session?.user?.id || 'No ID',
      dbUsers: dbUsers,
      dbUserCount: dbUsers.length,
      debugInfo: {
        hasAuthOptions: !!authOptions,
        sessionStrategy: authOptions.session?.strategy,
        providers: Object.keys(authOptions.providers || {})
      }
    })
  } catch (error: any) {
    console.error('Debug user info error:', error)
    return NextResponse.json({ 
      error: 'Failed to get user info', 
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
