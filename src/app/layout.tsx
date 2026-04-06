import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import fs from 'fs';
import path from 'path';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME || 'Platform'} | ${process.env.NEXT_PUBLIC_COMPANY_NAME || 'Management'}`,
  description: 'Enterprise Project Management OS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let theme = 'system';
  try {
    const configPath = path.join(process.cwd(), 'theme-config.json');
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (data.theme) theme = data.theme;
    }
  } catch(e) {}

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <body className={inter.className}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
