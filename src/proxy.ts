import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

const protectedRoutes = ['/dashboard', '/api/projects'];
const publicRoutes = ['/login', '/register', '/signup'];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  const token = request.cookies.get('auth_token')?.value;
  const session = token ? await verifyToken(token) : null;

  // Protect routes based on role
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // RBAC checks for Employees
  if (session && (session as any).role === 'EMPLOYEE') {
    const restrictedRoutes = ['/dashboard/financials', '/dashboard/settings'];
    if (restrictedRoutes.some(route => path.startsWith(route))) {
      // Redirect unauthorized employee to dashboard main
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect to dashboard if logged in and accessing public auth pages
  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Next response
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
