import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Management OS';
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Our Firm';
  const fromEmail = process.env.FROM_EMAIL || 'noreply@example.com';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; borderRadius: 10px;">
      <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
      <p style="color: #555; line-height: 1.6;">A password reset was requested for your account at <strong>${appName}</strong>.</p>
      <p style="color: #555; line-height: 1.6;">Click the button below to set a new password. This link will expire in 1 hour.</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      
      <p style="color: #888; font-size: 12px; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #aaa; font-size: 11px;">${companyName} | ${appName}</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"${appName}" <${fromEmail}>`,
    to,
    subject: `Reset your ${appName} password`,
    text: `Click here to reset your password: ${resetUrl}`,
    html,
  });

  return info;
}
