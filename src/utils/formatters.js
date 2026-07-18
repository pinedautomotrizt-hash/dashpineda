export const currency = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0,
});

export const number = new Intl.NumberFormat('es-PE');

export const usdCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function money(value) {
  return currency.format(Number(value || 0));
}

export function moneyByCurrency(value, currencyName) {
  return String(currencyName || '').toUpperCase() === 'DOLARES'
    ? usdCurrency.format(Number(value || 0))
    : money(value);
}

export function pct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function shortDate(value) {
  if (!value) return '';
  const [, month, day] = value.split('-');
  return `${day}/${month}`;
}

export function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}
