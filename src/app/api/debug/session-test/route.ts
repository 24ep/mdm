import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Session test endpoint called');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const session = await getServerSession(authOptions)
    console.log('Session result:', session);
    
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
    
    return NextResponse.json({
      success: true,
      session: {
        user: session.user,
        expires: session.expires
      },
      debug: {
        hasUser: !!session.user,
        hasUserId: !!session.user?.id,
        hasUserRole: !!session.user?.role,
        userRole: session.user?.role
      }
    })
  } catch (error: any) {
    console.error('Session test error:', error)
    return NextResponse.json({ 
      error: 'Session test failed', 
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
