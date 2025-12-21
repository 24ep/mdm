import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Add security headers to a response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
    // Basic security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    return response
}

/**
 * Handle CORS for requests
 */
export function handleCors(request: NextRequest): NextResponse | null {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            },
        })
    }
    return null
}

/**
 * Wrapper for API handlers with security headers
 */
export function withSecurityHeaders(handler: Function) {
    return async (request: NextRequest) => {
        // Handle CORS preflight
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        // Call the actual handler
        const response = await handler(request)

        // Add security headers
        return addSecurityHeaders(response)
    }
}
