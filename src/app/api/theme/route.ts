import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const configPath = path.join(process.cwd(), 'theme-config.json');

export async function GET() {
  try {
    let theme = 'system';
    let showActivityFeed = true;
    let inputFontColor = '';
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      theme = data.theme || 'system';
      showActivityFeed = data.showActivityFeed !== undefined ? data.showActivityFeed : true;
      inputFontColor = data.inputFontColor || '';
    }
    return NextResponse.json({ theme, showActivityFeed, inputFontColor });
  } catch (error) {
    return NextResponse.json({ theme: 'system' });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { theme, showActivityFeed, inputFontColor } = await request.json();
    
    const currentConfig = fs.existsSync(configPath) 
      ? JSON.parse(fs.readFileSync(configPath, 'utf8')) 
      : { theme: 'system', showActivityFeed: true };

    const newConfig = {
      theme: theme !== undefined ? theme : currentConfig.theme,
      showActivityFeed: showActivityFeed !== undefined ? showActivityFeed : currentConfig.showActivityFeed,
      inputFontColor: inputFontColor !== undefined ? inputFontColor : currentConfig.inputFontColor
    };

    if (newConfig.theme && !['system', 'light', 'dark', 'green'].includes(newConfig.theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    fs.writeFileSync(configPath, JSON.stringify(newConfig), 'utf8');
    
    // Invalidates root layout cache to apply new theme immediately to SSR HTML output
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, theme });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
