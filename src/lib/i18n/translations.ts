export type Locale = 'en' | 'he' | 'ar';

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'EN',
  he: 'עב',
  ar: 'ער',
};

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  he: 'עברית',
  ar: 'العربية',
};

export const DIRECTION: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  he: 'rtl',
  ar: 'rtl',
};

export const LOCALE_ORDER: Locale[] = ['en', 'he', 'ar'];

export const STORAGE_KEY = 'app-locale';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.projects': 'Projects',
    'nav.timesheets': 'Timesheets',
    'nav.financials': 'Financials',
    'nav.team': 'Team',
    'nav.archive': 'Archive',
    'nav.settings': 'Settings',
    'common.signOut': 'Sign Out',
    'common.theme': 'Theme',
    'common.language': 'Language',
    'common.dark': 'Dark',
    'common.light': 'Light',
  },
  he: {
    'nav.projects': 'פרויקטים',
    'nav.timesheets': 'דוחות שעות',
    'nav.financials': 'כספים',
    'nav.team': 'צוות',
    'nav.archive': 'ארכיון',
    'nav.settings': 'הגדרות',
    'common.signOut': 'התנתק',
    'common.theme': 'ערכת נושא',
    'common.language': 'שפה',
    'common.dark': 'כהה',
    'common.light': 'בהיר',
  },
  ar: {
    'nav.projects': 'المشاريع',
    'nav.timesheets': 'سجلات الوقت',
    'nav.financials': 'المالية',
    'nav.team': 'الفريق',
    'nav.archive': 'الأرشيف',
    'nav.settings': 'الإعدادات',
    'common.signOut': 'تسجيل الخروج',
    'common.theme': 'المظهر',
    'common.language': 'اللغة',
    'common.dark': 'داكن',
    'common.light': 'فاتح',
  },
};

export function translate(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}
