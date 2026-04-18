import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mail';
import { forgotPasswordSchema, formatZodError } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
    }
    const { email } = result.data;

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
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3007'}/reset-password?token=${token}`;

    // Check if email sending is configured
    const fromEmail = process.env.FROM_EMAIL;
    if (fromEmail) {
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
        console.log(`📧 Reset email sent to ${user.email}`);
      } catch (err) {
        console.error('Failed to send reset email:', err);
        // Fallback to console during development if email fails
        console.log(`\nFallback Reset Link (Email Failed): ${resetUrl}\n`);
      }
    } else {
      // IMPORTANT: Since we don't have SMTP set up, we print this secure link to the console.
      // In production, this would use a mailer like Resend or AWS SES.
      console.log('\n=========================================');
      console.log('🔒 PASSWORD RESET REQUESTED 🔒');
      console.log(`For User: ${user.email}`);
      console.log(`Click link to reset: ${resetUrl}`);
      console.log('=========================================\n');
    }

    return NextResponse.json({ message: 'If an account exists, a password reset link has been generated.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
