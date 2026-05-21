import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public paths that don't require authentication
const publicPaths = ['/login']

// Paths that redirect to dashboard if already authenticated
const authPaths = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cookie = request.cookies.get('auth-storage')

  let isAuthenticated = false
  if (cookie?.value) {
    try {
      const parsed = JSON.parse(cookie.value)
      isAuthenticated = parsed.state?.isAuthenticated === true
    } catch {
      // Invalid cookie, treat as unauthenticated
    }
  }

  // If trying to access login while authenticated, redirect to dashboard
  if (authPaths.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If accessing protected route without auth, redirect to login
  if (!publicPaths.includes(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
