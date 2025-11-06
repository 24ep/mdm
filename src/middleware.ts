import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
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
    // Protect all routes except auth, API debug, static files, and sign-in page
    '/((?!api/auth|api/debug|api/public|_next/static|_next/image|favicon.ico|auth/signin|[^/]+/auth/signin|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}