const LOCALE = 'en-IN';
const CURRENCY = 'INR';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 2,
});

export function formatCurrency(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return currencyFormatter.format(0);
  return currencyFormatter.format(n);
}

export function formatCompactCurrency(value) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
}

export function toInputDate(value) {
  const d = value instanceof Date ? value : value ? new Date(value) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function monthLabel(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString(LOCALE, { month: 'short' });
}
