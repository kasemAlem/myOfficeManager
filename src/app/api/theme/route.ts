import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const configPath = path.join(process.cwd(), 'theme-config.json');

export async function GET() {
  try {
    let theme = 'system';
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      theme = data.theme || 'system';
    }
    return NextResponse.json({ theme });
  } catch (error) {
    return NextResponse.json({ theme: 'system' });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { theme } = await request.json();
    if (!['system', 'light', 'dark', 'green'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    fs.writeFileSync(configPath, JSON.stringify({ theme }), 'utf8');
    
    // Invalidates root layout cache to apply new theme immediately to SSR HTML output
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, theme });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
