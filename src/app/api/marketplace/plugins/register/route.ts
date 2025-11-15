import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { registerAllPlugins } from '@/features/marketplace/lib/register-plugins'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'

/**
 * Register all marketplace plugins in the database
 * Only admins can run this
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can register plugins
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await registerAllPlugins()

    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/marketplace/plugins/register',
      200
    )

    return NextResponse.json({
      message: 'All plugins registered successfully',
    })
  } catch (error) {
    console.error('Error registering plugins:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

