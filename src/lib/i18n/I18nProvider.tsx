'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Locale, LOCALE_ORDER, DIRECTION, STORAGE_KEY, translate } from './translations';

interface I18nContextValue {
  locale: Locale;
  direction: 'ltr' | 'rtl';
  t: (key: string) => string;
  setLocale: (locale: Locale) => void;
  cycleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === 'en' || stored === 'he' || stored === 'ar')) {
      setLocaleState(stored);
    }
  }, []);

  const applyLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    document.documentElement.setAttribute('lang', newLocale);
    document.documentElement.setAttribute('dir', DIRECTION[newLocale]);
    document.documentElement.setAttribute('data-locale', newLocale);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    applyLocale(newLocale);
  }, [applyLocale]);

  const cycleLocale = useCallback(() => {
    const currentIndex = LOCALE_ORDER.indexOf(locale);
    const nextIndex = (currentIndex + 1) % LOCALE_ORDER.length;
    applyLocale(LOCALE_ORDER[nextIndex]);
  }, [locale, applyLocale]);

  const t = useCallback((key: string): string => {
    return translate(locale, key);
  }, [locale]);

  const value: I18nContextValue = {
    locale,
    direction: DIRECTION[locale],
    t,
    setLocale,
    cycleLocale,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
