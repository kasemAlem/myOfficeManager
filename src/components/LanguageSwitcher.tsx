'use client';

import { Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { LOCALE_NAMES } from '@/lib/i18n/translations';

export function LanguageSwitcher() {
  const { locale, cycleLocale } = useI18n();

  return (
    <button
      onClick={cycleLocale}
      aria-label={`Switch language to next`}
      className="transition-standard"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.65rem 1rem',
        width: '100%',
        background: 'transparent',
        border: '1px solid transparent',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        borderRadius: '10px',
        fontSize: '0.8125rem',
        fontWeight: 500,
      }}
    >
      <Languages size={18} />
      <span style={{ flex: 1, textAlign: 'start' }}>Language</span>
      <span style={{
        fontSize: '0.6875rem',
        color: 'var(--text-muted)',
        textTransform: 'capitalize',
        background: 'var(--input-bg)',
        padding: '0.2rem 0.5rem',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        direction: 'ltr',
      }}>
        {LOCALE_NAMES[locale]}
      </span>
    </button>
  );
}
