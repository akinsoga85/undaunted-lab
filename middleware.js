import { NextResponse } from 'next/server';

// Cheap gate: no session cookie → sign-in page. Each admin page still checks the session in the database.
export function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin/login') || pathname.startsWith('/admin/verify')) return NextResponse.next();
  if (!req.cookies.get('ul_admin')) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
