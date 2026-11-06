export const CURRENCY_CODES = [
  'UZS',
  'USD',
  'EUR',
  'RUB',
  'KZT',
  'TRY',
  'TJS',
  'KGS',
  'TMT',
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

// CBU kurslari: 1 birlik valyuta = shuncha so'm (2026-11-02).
export const UZS_RATES: Record<CurrencyCode, number> = {
  UZS: 1,
  USD: 12023.46,
  EUR: 13461.47,
  RUB: 149.44,
  KZT: 26.49,
  TRY: 240.87,
  TJS: 1306.19,
  KGS: 137.45,
  TMT: 3435.27,
};

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && (CURRENCY_CODES as readonly string[]).includes(value);
}

export function convertCurrency(
  amount: number,
  from: CurrencyCode = 'UZS',
  to: CurrencyCode = 'UZS',
): number {
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return amount;
  return (amount * UZS_RATES[from]) / UZS_RATES[to];
}

export function formatCurrencyAmount(
  amount: number,
  currency: CurrencyCode,
  locale: 'uz' | 'ru' | 'en' = 'uz',
): string {
  const fixed = amount.toFixed(currency === 'UZS' ? 0 : 2);
  const [whole, fraction] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, locale === 'en' ? ',' : ' ');
  const trimmed = fraction?.replace(/0+$/, '');
  return trimmed ? `${grouped}.${trimmed}` : grouped;
}
