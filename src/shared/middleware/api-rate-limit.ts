import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from '../lib/security/rate-limiter'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * API Rate Limiting Middleware
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  options: {
    windowMs?: number
    maxRequests?: number
  } = {}
): Promise<NextResponse | null> {
  const { windowMs = 60000, maxRequests = 100 } = options

  try {
    // Get user identifier
    const session = await getServerSession(authOptions)
    const identifier = session?.user?.id || request.ip || 'anonymous'

    // Check rate limit
    const result = await rateLimiter.checkLimit(identifier, {
      windowMs,
      maxRequests,
      keyPrefix: 'api_rate_limit',
    })

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          resetAt: result.resetAt.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetAt.toISOString(),
            'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Add rate limit headers to response
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString())

    return null // Continue with request
  } catch (error) {
    console.error('Rate limit middleware error:', error)
    // Fail open - allow request on error
    return null
  }
}

