const CURRENCY_CODE = process.env.NEXT_PUBLIC_CURRENCY_CODE || 'ILS';
const LOCALE = process.env.NEXT_PUBLIC_LOCALE || 'he-IL';

export function getCurrencySymbol(): string {
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
