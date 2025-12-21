import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PASSWORD = 'Template123123';
const PASSWORD_COOKIE = 'template_auth';

export function middleware(request: NextRequest) {
  // VÃ©rifier si l'utilisateur est dÃ©jÃ  authentifiÃ©
  const isAuthenticated = request.cookies.get(PASSWORD_COOKIE)?.value === 'authenticated';

  // Si dÃ©jÃ  authentifiÃ©, laisser passer
  if (isAuthenticated) {
    return NextResponse.next();
  }

  // Si c'est la route de vÃ©rification du mot de passe, laisser passer
  if (request.nextUrl.pathname === '/api/auth/check-password') {
    return NextResponse.next();
  }

  // Si c'est la route de login, laisser passer
  if (request.nextUrl.pathname.startsWith('/login-password')) {
    return NextResponse.next();
  }

  // Rediriger vers la page de login
  const loginUrl = new URL('/login-password', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/check-password (API route pour vÃ©rifier le mot de passe)
     * - login-password (page de login)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth/check-password|login-password|_next/static|_next/image|favicon.ico).*)',
  ],
};