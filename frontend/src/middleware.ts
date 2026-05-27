import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/dashboard', '/saved', '/planner', '/profile']
const AUTH_PAGES = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('pantrychef_auth')?.value
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  const isAuthPage = AUTH_PAGES.includes(pathname)

  if (isProtected && !token) {
    const url = new URL('/pantrychef/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/pantrychef/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/saved/:path*', '/planner/:path*', '/profile/:path*', '/login', '/signup'],
}
