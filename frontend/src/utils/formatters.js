export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-SV', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPercentage(value) {
  return `${(value * 100).toFixed(2)}%`;
}
const ETIQUETAS = {
  DISENO: 'Diseño',
  TERRACERIA: 'Terracería',
  OBRA_GRIS: 'Obra gris',
  ACABADOS: 'Acabados',
  FINALIZADO: 'Finalizado',
  PLANIFICACION: 'Planificación',
  EN_EJECUCION: 'En ejecución',
  SUSPENDIDO: 'Suspendido',
};

export function formatEstado(valor) {
  if (!valor) return '-';
  if (ETIQUETAS[valor]) return ETIQUETAS[valor];
  const texto = String(valor).replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}