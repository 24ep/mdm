import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    // Protect all routes except auth, API debug, static files, and sign-in page
    '/((?!api/auth|api/debug|api/public|_next/static|_next/image|favicon.ico|auth/signin|[^/]+/auth/signin|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}