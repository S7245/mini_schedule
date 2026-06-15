import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Exact public paths (no auth required)
const publicExact = ['/login']

// Prefix public paths (no auth required, covers dynamic segments)
const publicPrefixes = ['/signup']

// Paths that redirect to dashboard if already authenticated
const authPaths = ['/login']

function isPublic(pathname: string): boolean {
  if (publicExact.includes(pathname)) return true
  return publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('brand_access_token')?.value
  const isAuthenticated = Boolean(accessToken)

  // If trying to access login while authenticated, redirect to dashboard
  if (authPaths.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If accessing protected route without auth, redirect to login
  if (!isPublic(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
