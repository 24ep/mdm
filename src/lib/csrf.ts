import { NextRequest, NextResponse } from 'next/server'

/**
 * CSRF Protection utility for Next.js middleware and route handlers.
 * Next.js already provides some built-in protection for Server Actions,
 * but custom API routes (Route Handlers) may need explicit checks.
 */
export function verifyCsrf(req: NextRequest) {
    // Only check state-changing methods
    const method = req.method.toUpperCase()
    if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
        return true
    }

    const origin = req.headers.get('origin')
    const host = req.headers.get('host')
    const xForwardedHost = req.headers.get('x-forwarded-host')

    // If no origin is present, we should be cautious but some legitimate requests might omit it.
    // However, for cross-site requests, browsers always include it.
    if (!origin) {
        // In many environments, requests without Origin should be blocked for state-changing operations
        // unless they are from the same-site and the browser didn't send it.
        // However, strictly requiring Origin for POST/PUT/DELETE is a safer default.
        return true // We'll rely on SameSite cookies if Origin is missing, but better security would be to log/monitor this.
    }

    try {
        const originUrl = new URL(origin)
        const currentHost = xForwardedHost || host

        // Check if origin matches host
        // We allow localhost for development
        if (originUrl.host === currentHost ||
            (process.env.NODE_ENV === 'development' && originUrl.hostname === 'localhost')) {
            return true
        }

        // Check against allowed origins
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || []
        if (allowedOrigins.includes(origin) || allowedOrigins.includes(originUrl.origin)) {
            return true
        }

        return false
    } catch (e) {
        return false
    }
}

/**
 * Middleware component for CSRF protection
 */
export function csrfMiddleware(req: NextRequest) {
    if (!verifyCsrf(req)) {
        return new NextResponse(
            JSON.stringify({ error: 'CSRF validation failed' }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
    return null
}
