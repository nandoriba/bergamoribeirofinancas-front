import { describe, expect, it } from 'vitest';

import { formatAxisCurrency, formatBRL, formatCurrency } from './format';

describe('currency formatters', () => {
  it('formats cents in pt-BR without symbol', () => {
    expect(formatBRL(842015)).toBe('8.420,15');
  });

  it('formats cents with symbol', () => {
    expect(formatCurrency(214080)).toBe('R$ 2.140,80');
  });

  it('formats chart axis labels compactly', () => {
    expect(formatAxisCurrency(1250000)).toBe('R$ 12.5k');
  });
});

