export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrency(cents: number): string {
  return `R$ ${formatBRL(cents)}`;
}

export function formatAxisCurrency(cents: number): string {
  const reais = cents / 100;

  if (reais >= 1000) {
    return `R$ ${(reais / 1000).toFixed(1)}k`;
  }

  return `R$ ${reais.toFixed(0)}`;
}

