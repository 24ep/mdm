import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Users test endpoint called');
    
    // Check session
    const session = await getServerSession(authOptions)
    console.log('Session:', session);
    
    if (!session) {
      return NextResponse.json({
        error: 'No session found',
        debug: {
          hasAuthOptions: !!authOptions,
          requestUrl: request.url,
          headers: Object.fromEntries(request.headers.entries())
        }
      }, { status: 401 })
    }
    
    // Check user role
    const userRole = session.user?.role
    console.log('User role:', userRole);
    
    if (!userRole) {
      return NextResponse.json({
        error: 'No user role found',
        session: session
      }, { status: 403 })
    }
    
    // Test database connection and get users
    try {
      const result = await query<any>('SELECT id, email, name, role, is_active FROM public.users LIMIT 5')
      console.log('Database users:', result.rows);
      
      return NextResponse.json({
        success: true,
        session: {
          user: session.user,
          expires: session.expires
        },
        userRole: userRole,
        dbUsers: result.rows,
        debug: {
          hasAuthOptions: !!authOptions,
          sessionStrategy: authOptions.session?.strategy,
          providers: Object.keys(authOptions.providers || {})
        }
      })
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        error: 'Database error',
        details: dbError.message,
        session: session
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('Users test error:', error)
    return NextResponse.json({ 
      error: 'Users test failed', 
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
