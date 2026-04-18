import { NextResponse } from 'next/server';
import { getSession, signToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    if (user.role !== session.role) {
      const token = await signToken({ userId: user.id, role: user.role });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
