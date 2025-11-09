/**
 * API Middleware Utilities
 * Reusable middleware functions for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * API Handler type
 */
export type ApiHandler<T = any> = (
  request: NextRequest,
  context: T & { session: any }
) => Promise<NextResponse> | NextResponse

/**
 * API Context with session
 */
export interface ApiContext {
  session: any
  userId?: string
  userEmail?: string
  userName?: string
}

/**
 * Middleware to require authentication
 * Returns null if authenticated, or NextResponse with error if not
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  return null
}

/**
 * Wrapper to add authentication to API handlers
 */
export function withAuth<T = {}>(handler: ApiHandler<T & ApiContext>) {
  return async (request: NextRequest, context: T) => {
    const authError = await requireAuth(request)
    if (authError) return authError
    
    const session = await getServerSession(authOptions)
    
    return handler(request, {
      ...context,
      session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
    } as T & ApiContext)
  }
}

/**
 * Standardized error handler for API routes
 */
export function handleApiError(
  error: unknown,
  context?: string,
  statusCode: number = 500
): NextResponse {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const stack = error instanceof Error ? error.stack : undefined
  
  console.error(`[${context || 'API'}] Error:`, error)
  
  return NextResponse.json(
    {
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? message : undefined,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined,
    },
    { status: statusCode }
  )
}

/**
 * Wrapper to add error handling to API handlers
 */
export function withErrorHandling<T = {}>(
  handler: ApiHandler<T>,
  context?: string
) {
  return async (request: NextRequest, contextData: T) => {
    try {
      return await handler(request, contextData)
    } catch (error) {
      return handleApiError(error, context)
    }
  }
}

/**
 * Combined middleware: authentication + error handling
 */
export function withAuthAndErrorHandling<T = {}>(
  handler: ApiHandler<T & ApiContext>,
  context?: string
) {
  return withErrorHandling(withAuth(handler), context)
}

/**
 * Parse JSON body safely
 */
export async function parseJsonBody<T = any>(request: NextRequest): Promise<T | null> {
  try {
    const bodyText = await request.text()
    if (!bodyText) return null
    return JSON.parse(bodyText) as T
  } catch (error) {
    console.warn('Failed to parse request body:', error)
    return null
  }
}

/**
 * Get request metadata
 */
export function getRequestMetadata(request: NextRequest) {
  return {
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    method: request.method,
    url: request.url,
  }
}

