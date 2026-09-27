import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const pathname = request.nextUrl.pathname;
  
  // Izinkan rute auth dan login lewat tanpa token
  const isAuthRoute = pathname.startsWith('/api/auth/login') || pathname === '/login';
  
  // Jika tidak ada token dan mencoba akses protected route
  if (!sessionCookie && !isAuthRoute) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Redirect halaman ke login jika bukan API
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika ada token, verifikasi
  if (sessionCookie) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      await jwtVerify(sessionCookie.value, secret);
      
      // Jika user sudah login dan mencoba ke halaman login, pindahkan ke /chat
      if (pathname === '/login' || pathname === '/') {
        return NextResponse.redirect(new URL('/chat', request.url));
      }
    } catch (err) {
      // Token tidak valid atau kadaluarsa
      if (!isAuthRoute) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/chat/:path*', '/api/:path*', '/login', '/'],
};
