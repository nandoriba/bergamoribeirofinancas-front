export const ACCOUNT_TYPES = ['checking', 'credit_card', 'investment'] as const;
export const CATEGORY_TYPES = ['income', 'expense'] as const;
export const TRANSACTION_TYPES = ['income', 'expense', 'transfer'] as const;
export const TRANSACTION_STATUSES = ['confirmed', 'pending'] as const;
export const INVOICE_STATUSES = ['open', 'closed', 'paid'] as const;
export const RECURRING_STATUSES = ['active', 'paused'] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type CategoryType = (typeof CATEGORY_TYPES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type RecurringStatus = (typeof RECURRING_STATUSES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta corrente',
  credit_card: 'Cartão de crédito',
  investment: 'Investimento',
};

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  income: 'Receita',
  expense: 'Despesa',
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Receita',
  expense: 'Despesa',
  transfer: 'Transferência',
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  paid: 'Paga',
};

export const RECURRING_STATUS_LABELS: Record<RecurringStatus, string> = {
  active: 'Ativo',
  paused: 'Pausado',
};
