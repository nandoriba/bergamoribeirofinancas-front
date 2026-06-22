export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrency(cents: number): string {
  return `R$ ${formatBRL(cents)}`;
}

export function parseCurrencyInputCents(value: string): number {
  const isNegative = value.includes('-');
  const digits = value.replace(/\D/g, '');

  if (!digits) return 0;

  const cents = Number.parseInt(digits, 10);
  if (!Number.isFinite(cents)) return 0;

  return isNegative ? -cents : cents;
}

export function formatAxisCurrency(cents: number): string {
  const reais = cents / 100;

  if (reais >= 1000) {
    return `R$ ${(reais / 1000).toFixed(1)}k`;
  }

  return `R$ ${reais.toFixed(0)}`;
}
