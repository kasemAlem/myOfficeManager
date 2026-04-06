import { NextResponse } from 'next/server';
import { getSession, verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const response = NextResponse.json(user);

    // Auto-refresh the JWT token if the role in the database has diverges from the token's payload
    if (user.role !== session.role) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-development-only-x92');
      const token = await new jose.SignJWT({ userId: user.id, email: user.email, role: user.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(secret);

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
