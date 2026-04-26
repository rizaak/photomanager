import { auth0 } from '@/src/lib/auth0'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  // Let the Auth0 SDK handle its own /auth/* routes
  const res = await auth0.middleware(req)

  // Protect all dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    const session = await auth0.getSession(req)
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
}
