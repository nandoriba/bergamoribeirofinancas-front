import { describe, expect, it } from 'vitest';

import { formatAxisCurrency, formatBRL, formatCurrency, parseCurrencyInputCents } from './format';

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

  it('parses currency input as a cent-based mask', () => {
    expect(parseCurrencyInputCents('0,001')).toBe(1);
    expect(parseCurrencyInputCents('0,011')).toBe(11);
    expect(parseCurrencyInputCents('0,111')).toBe(111);
    expect(parseCurrencyInputCents('11,111')).toBe(11111);
  });

  it('parses pasted currency input with Brazilian separators', () => {
    expect(parseCurrencyInputCents('R$ 1.234,56')).toBe(123456);
    expect(parseCurrencyInputCents('-1.234,56')).toBe(-123456);
  });
});
