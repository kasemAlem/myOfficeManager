import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'phases-config.json');

const DEFAULT_PHASES = [
  {
    name: "ייזום והגדרת פרויקט",
    description: [
      "פגישה ראשונית עם הלקוח",
      "הבנת צרכים, חזון, תקציב ולוחות זמנים",
      "בדיקת היתכנות ראשונית (תב\"ע, זכויות בנייה, מגבלות)",
      "הגדרת מטרות הפרויקט (Scope Definition)"
    ]
  },
  {
    name: "תכנון קונספטואלי",
    description: [
      "יצירת סקיצות ראשוניות",
      "בחינת חלופות תכנוניות",
      "התאמה לדרישות הלקוח",
      "הערכת עלויות גסה (Order of Magnitude)"
    ]
  },
  {
    name: "תכנון מוקדם",
    description: [
      "פיתוח התוכנית הנבחרת",
      "הכנת תוכניות עקרוניות (תכנון אדריכלי ראשוני)",
      "תיאום ראשוני עם יועצים (קונסטרוקציה, חשמל, אינסטלציה וכו')",
      "אומדן עלויות מעודכן"
    ]
  },
  {
    name: "תכנון מפורט",
    description: [
      "הכנת סט תוכניות מלא לביצוע",
      "מפרטים טכניים",
      "תיאום מערכות מלא (Coordination)",
      "עבודה עם יועצים שונים (קונסטרוקטור, מיזוג, תאורה וכו')"
    ]
  },
  {
    name: "רישוי והיתרים",
    description: [
      "הגשת תוכניות לוועדות (היתר בנייה)",
      "טיפול בהערות הרשויות",
      "קבלת אישורים נדרשים"
    ]
  },
  {
    name: "הכנת מכרזים והתקשרויות",
    description: [
      "הכנת מסמכי מכרז",
      "קבלת הצעות מקבלנים",
      "השוואת הצעות (Bid Analysis)",
      "בחירת קבלן וחתימה על חוזים"
    ]
  },
  {
    name: "ביצוע ופיקוח",
    description: [
      "ליווי האתר",
      "פיקוח עליון/פיקוח צמוד",
      "ניהול לוחות זמנים (Schedule Control)",
      "בקרת איכות ובקרה תקציבית",
      "טיפול בשינויים (Change Orders)"
    ]
  },
  {
    name: "מסירה וסיום פרויקט",
    description: [
      "בדיקות סופיות (Snag List / Punch List)",
      "תיקון ליקויים",
      "מסירת הפרויקט ללקוח",
      "מסמכי As-Built",
      "סגירה פיננסית"
    ]
  }
];

export async function GET() {
  try {
    let phases = DEFAULT_PHASES;
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      phases = data.phases || DEFAULT_PHASES;
    }
    return NextResponse.json({ phases });
  } catch (error) {
    return NextResponse.json({ phases: DEFAULT_PHASES });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phases } = await request.json();
    if (!Array.isArray(phases)) {
      return NextResponse.json({ error: 'Invalid phases payload' }, { status: 400 });
    }

    fs.writeFileSync(configPath, JSON.stringify({ phases }, null, 2), 'utf8');

    return NextResponse.json({ success: true, phases });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
