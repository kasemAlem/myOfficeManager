const CURRENCY_CODE = process.env.NEXT_PUBLIC_CURRENCY_CODE || 'ILS';
const LOCALE = process.env.NEXT_PUBLIC_LOCALE || 'he-IL';

/**
 * Derives the currency symbol from the currency code using Intl.NumberFormat.
 * This avoids encoding issues when the .env file is saved with incorrect
 * encoding on Windows (e.g. Notepad saving UTF-8 ₪ as ANSI â‚ª).
 */
export function getCurrencySymbol(): string {
  try {
    // Extract just the symbol by formatting 0 and stripping digits/whitespace
    const parts = new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: CURRENCY_CODE,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    const symbolPart = parts.find(p => p.type === 'currency');
    if (symbolPart?.value) return symbolPart.value;
  } catch {
    // Fall through to env fallback
  }
  return process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₪';
}

export function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: CURRENCY_CODE,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${getCurrencySymbol()}${amount.toLocaleString(LOCALE)}`;
  }
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
}
