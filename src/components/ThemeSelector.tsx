'use client';

import { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';

const THEMES = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
] as const;

export function ThemeSelector() {
  const { t } = useI18n();
  const [current, setCurrent] = useState('dark');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    setCurrent(theme === 'light' ? 'light' : 'dark');
  }, []);

  const handleToggle = async () => {
    const next = current === 'dark' ? 'light' : 'dark';
    setCurrent(next);
    localStorage.setItem('user-theme', next);
    document.documentElement.setAttribute('data-theme', next);

    try {
      await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: next }),
      });
    } catch {
      // Theme still applied locally
    }
  };

  const Icon = current === 'dark' ? Moon : Sun;

  return (
    <div ref={containerRef}>
      <button
        onClick={handleToggle}
        aria-label={`Switch to ${current === 'dark' ? 'light' : 'dark'} theme`}
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
        <Icon size={18} />
        <span style={{ flex: 1, textAlign: 'start' }}>{t('common.theme')}</span>
        <span style={{
          fontSize: '0.6875rem',
          color: 'var(--text-muted)',
          textTransform: 'capitalize',
          background: 'var(--input-bg)',
          padding: '0.2rem 0.5rem',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
        }}>
          {t(current === 'dark' ? 'common.dark' : 'common.light')}
        </span>
      </button>
    </div>
  );
}
