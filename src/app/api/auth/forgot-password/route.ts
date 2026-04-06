import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    
    // Always return success even if user not found to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a password reset link has been generated.' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    // Store in database
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    });

    // Generate reset URL (mocking domain for local dev)
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

    // IMPORTANT: Since we don't have SMTP set up, we print this secure link to the console.
    // In production, this would use a mailer like Resend or AWS SES.
    console.log('\n=========================================');
    console.log('🔒 PASSWORD RESET REQUESTED 🔒');
    console.log(`For User: ${user.email}`);
    console.log(`Click link to reset: ${resetUrl}`);
    console.log('=========================================\n');

    return NextResponse.json({ message: 'If an account exists, a password reset link has been generated.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
