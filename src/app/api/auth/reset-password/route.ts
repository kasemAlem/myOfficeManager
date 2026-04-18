import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { resetPasswordSchema, formatZodError } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: formatZodError(result.error) }, { status: 400 });
    }
    const { token, newPassword } = result.data;

    // Find and validate token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password and delete the token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      })
    ]);

    return NextResponse.json({ message: 'Password has been successfully recovered!' });
  } catch (error) {
    console.error('Password reset apply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
