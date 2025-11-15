import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { addSecurityHeaders, handleCors } from '@/lib/security-headers'

export default withAuth(
  function proxy(req: NextRequest & { nextauth: { token: any } }) {
    // Handle CORS for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const corsResponse = handleCors(req, {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true,
      })
      
      if (corsResponse) {
        return corsResponse
      }
    }

    // Create response
    const response = NextResponse.next()

    // Add security headers to all responses
    return addSecurityHeaders(response)
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        if (!token) return false
        const exp = (token as any).exp as number | undefined
        if (!exp) return true // fallback: if no exp set, allow (legacy sessions)
        const now = Math.floor(Date.now() / 1000)
        return exp > now
      }
    },
  }
)

export const config = {
  matcher: [
    // Protect all routes except auth, API debug, API public, API dify, static files, and sign-in page
    '/((?!api/auth|api/debug|api/public|api/dify|_next/static|_next/image|favicon.ico|auth/signin|[^/]+/auth/signin|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

