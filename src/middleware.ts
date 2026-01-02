import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { addSecurityHeaders, handleCors, addCorsHeaders } from '@/lib/security-headers'

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

    // Add CORS headers to all API responses (not just preflight)
    if (req.nextUrl.pathname.startsWith('/api/')) {
      addCorsHeaders(req, response, {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true,
      })
    }

    // Add security headers to all responses with route-specific CSP
    return addSecurityHeaders(response, req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Allow public routes that need headers but no auth
        // These routes are used by the chatbot embed and need to be accessible
        // without authentication when embedded on external websites
        if (
          path.startsWith('/chat') ||
          path.startsWith('/api/chat') ||
          path.startsWith('/next-api/chat') ||
          path.startsWith('/api/chatbots') ||
          path.startsWith('/api/pwa') ||
          path.startsWith('/api/public') ||
          path.startsWith('/api/embed') ||
          path.startsWith('/next-api/embed') ||
          path.startsWith('/api/chatkit') ||
          path.startsWith('/next-api/chatkit') ||
          path.startsWith('/api/dify') ||
          path.startsWith('/api/openai-agent-sdk') ||
          path.startsWith('/next-api/openai-agent-sdk') ||
          path.startsWith('/api/openai-realtime') ||
          path.startsWith('/api/agentbuilder')
        ) {
          return true
        }

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
    // Protect all routes except auth, API debug, static files, and sign-in page
    // Note: We include chat and public APIs here so headers are applied, but authorized callback allows them
    '/((?!api/auth|api/debug|auth/signin|[^/]+/auth/signin|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|js)$).*)',
  ],
}

