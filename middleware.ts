import { auth0 } from '@/src/lib/auth0'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  // Let the Auth0 SDK handle its own /api/auth/* routes first
  const res = await auth0.middleware(req)

  // Protect all /dashboard routes — redirect unauthenticated users to Auth0 login
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    const session = await auth0.getSession(req)
    if (!session) {
      const loginUrl = new URL('/api/auth/login', req.url)
      // Preserve the intended destination so Auth0 redirects back after login
      loginUrl.searchParams.set('returnTo', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(loginUrl)
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
