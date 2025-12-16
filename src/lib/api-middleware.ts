/**
 * API Middleware Utilities
 * Reusable middleware functions for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from './logger'
import { addSecurityHeaders } from './security-headers'
import { withTracing } from './tracing-middleware'

/**
 * API Handler type
 */
export type ApiHandler<T = any> = (
  request: NextRequest,
  context: T & { session?: any }
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
 * Get session from request
 * Returns session or null if not authenticated
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * Require authentication - checks for session.user
 * Returns session if authenticated, or error response if not
 * Use this when you only need to check if user is logged in
 */
export async function requireAuth(): Promise<
  | { success: true; session: NonNullable<Awaited<ReturnType<typeof getServerSession>>> & { user: { id: string; role?: string; email?: string; name?: string } } }
  | { success: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return {
      success: false,
      response: addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }
  }
  
  return { success: true, session: session as any }
}

/**
 * Require authentication with user ID - checks for session.user.id
 * Returns session if authenticated, or error response if not
 * Use this when you need the user ID (most common case)
 */
export async function requireAuthWithId(): Promise<
  | { success: true; session: NonNullable<Awaited<ReturnType<typeof getServerSession>>> & { user: { id: string; role?: string; email?: string; name?: string } } }
  | { success: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return {
      success: false,
      response: addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }
  }
  
  return { success: true, session: session as any }
}

/**
 * Require admin role
 * Returns session if user is admin, or error response if not
 */
export async function requireAdmin(): Promise<
  | { success: true; session: NonNullable<Awaited<ReturnType<typeof getServerSession>>> & { user: { id: string; role: string; name?: string; email?: string } } }
  | { success: false; response: NextResponse }
> {
  const authResult = await requireAuthWithId()
  
  if (!authResult.success) {
    return authResult
  }
  
  const { session } = authResult
  const role = (session.user as any)?.role
  
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return {
      success: false,
      response: addSecurityHeaders(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
    }
  }
  
  return { success: true, session: session as any }
}

/**
 * Wrapper to add authentication to API handlers
 * @deprecated Use requireAuth() or requireAuthWithId() directly for better control
 */
export function withAuth<T = {}>(handler: ApiHandler<T & ApiContext>) {
  return async (request: NextRequest, ...args: any[]) => {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    
    const { session } = authResult
    const context = (args[0] || {}) as T
    
    return handler(request, {
      ...context,
      session,
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
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
  
  logger.error(`[${context || 'API'}] Error`, error, {
    statusCode,
    message,
  })
  
  const response = NextResponse.json(
    {
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? message : undefined,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined,
    },
    { status: statusCode }
  )
  
  return addSecurityHeaders(response)
}

/**
 * Wrapper to add error handling to API handlers
 * Works for both routes with and without params
 */
// Overload for routes without params
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  context?: string
): (request: NextRequest) => Promise<NextResponse>;
// Overload for routes with params
export function withErrorHandling<T extends { params: Promise<any> }>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse> | NextResponse,
  context?: string
): (request: NextRequest, context: T) => Promise<NextResponse>;
// Implementation
export function withErrorHandling<T extends { params: Promise<any> } | undefined>(
  handler: ((request: NextRequest) => Promise<NextResponse> | NextResponse) | ((request: NextRequest, context: T) => Promise<NextResponse> | NextResponse),
  context?: string
) {
  // Check if handler expects 1 or 2 parameters based on function length
  if (handler.length === 1) {
    // Handler only takes request
    return async (request: NextRequest) => {
      try {
        return await (handler as (request: NextRequest) => Promise<NextResponse>)(request)
      } catch (error) {
        return handleApiError(error, context)
      }
    }
  } else {
    // Handler takes request and context
    return async (request: NextRequest, contextData: T) => {
      try {
        return await (handler as (request: NextRequest, context: T) => Promise<NextResponse>)(request, contextData)
      } catch (error) {
        return handleApiError(error, context)
      }
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
 * Combined middleware: tracing + authentication + error handling
 * Automatically creates distributed traces for all API requests
 */
export function withTracingAndAuth<T = {}>(
  handler: ApiHandler<T & ApiContext>,
  options: {
    traceName?: string | ((request: NextRequest) => string)
    context?: string
  } = {}
) {
  const tracedHandler = withTracing(
    withAuthAndErrorHandling(handler, options.context),
    {
      traceName: options.traceName
    }
  )
  return tracedHandler
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
    logger.warn('Failed to parse request body', { error, url: request.url })
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

