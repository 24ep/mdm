/**
 * Security Headers Middleware
 * Provides security headers for Next.js API routes and pages
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Security headers configuration
 */
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  // Note: X-Frame-Options removed - use CSP frame-ancestors instead
  // Chat embed functionality requires allowing iframes from any origin
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.platform.openai.com", // Next.js features + ChatKit + blob for dynamic modules
    "style-src 'self' 'unsafe-inline' data: blob: https://fonts.googleapis.com", // Google Fonts CSS + data/blob for Next.js CSS
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com", // Google Fonts files
    "connect-src 'self' https:",
    "frame-src 'self' https://cdn.platform.openai.com", // OpenAI ChatKit frames
    "frame-ancestors * http: https: file: http://localhost:* https://localhost:*", // Allow embedding in iframes from any origin
  ].join('; '),
}

/**
 * Get appropriate CSP header based on route
 */
export function getCspForRoute(pathname: string): string {
  // Relaxed CSP for embedded chat routes
  if (
    pathname.startsWith('/chat') || 
    pathname.startsWith('/api/chatkit') || 
    pathname.startsWith('/next-api/chatkit') ||
    pathname.startsWith('/api/embed') ||
    pathname.startsWith('/next-api/embed')
  ) {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.platform.openai.com *.openai.com",
      "style-src 'self' 'unsafe-inline' data: blob: https://fonts.googleapis.com *",
      "img-src 'self' data: blob: https: *",
      "font-src 'self' data: blob: https://fonts.gstatic.com *",
      "connect-src 'self' https: wss: *",
      "frame-src 'self' https://cdn.platform.openai.com *",
      "frame-ancestors * http: https: file: http://localhost:* https://localhost:*",
    ].join('; ')
  }

  // Strict CSP for admin and other routes
  return securityHeaders['Content-Security-Policy']
}

/**
 * Add security headers to a response
 */
export function addSecurityHeaders(response: NextResponse, pathname?: string): NextResponse {
  // if (pathname?.includes('next-api') || pathname?.includes('chat')) {
  //   console.log(`[SecurityHeaders] Adding headers for ${pathname}`)
  // }
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (key === 'Content-Security-Policy' && pathname) {
      // Use route-specific CSP
      response.headers.set(key, getCspForRoute(pathname))
    } else {
      response.headers.set(key, value)
    }
  })
  return response
}

/**
 * Middleware to add security headers to API responses
 */
export function withSecurityHeaders<T extends NextResponse>(
  response: T
): T {
  return addSecurityHeaders(response) as T
}

/**
 * CORS configuration for API routes
 */
export interface CorsOptions {
  origin?: string | string[] | ((origin: string | null) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

const defaultCorsOptions: Required<CorsOptions> = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400, // 24 hours
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(request: NextRequest, options: CorsOptions = {}): NextResponse | null {
  const opts = { ...defaultCorsOptions, ...options }
  const origin = request.headers.get('origin')

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })

    // Set allowed origin
    if (origin && (typeof opts.origin === 'function'
      ? opts.origin(origin)
      : Array.isArray(opts.origin)
        ? opts.origin.includes(origin)
        : opts.origin === '*' || opts.origin === origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (opts.origin === '*') {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }

    response.headers.set('Access-Control-Allow-Methods', opts.methods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '))
    response.headers.set('Access-Control-Max-Age', String(opts.maxAge))

    if (opts.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return addSecurityHeaders(response)
  }

  return null
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  request: NextRequest,
  response: NextResponse,
  options: CorsOptions = {}
): NextResponse {
  const opts = { ...defaultCorsOptions, ...options }
  const origin = request.headers.get('origin')

  if (origin && (typeof opts.origin === 'function'
    ? opts.origin(origin)
    : Array.isArray(opts.origin)
      ? opts.origin.includes(origin)
      : opts.origin === '*' || opts.origin === origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (opts.origin === '*') {
    response.headers.set('Access-Control-Allow-Origin', '*')
  }

  if (opts.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

