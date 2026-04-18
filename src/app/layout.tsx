import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import fs from 'fs';
import path from 'path';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME || 'Platform'} | ${process.env.NEXT_PUBLIC_COMPANY_NAME || 'Management'}`,
  description: 'Enterprise Project Management OS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let theme = 'dark';
  let inputFontColor = '';
  try {
    const configPath = path.join(process.cwd(), 'theme-config.json');
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (data.theme) theme = data.theme;
      if (data.inputFontColor) inputFontColor = data.inputFontColor;
    }
  } catch(e) {}

  return (
    <html lang="en" dir="ltr" data-theme={theme} suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable}`} style={inputFontColor ? { '--custom-input-color': inputFontColor } as React.CSSProperties : {}}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
