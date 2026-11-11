export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('es', { style: 'currency', currency }).format(value);
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('es').format(new Date(value));
}
