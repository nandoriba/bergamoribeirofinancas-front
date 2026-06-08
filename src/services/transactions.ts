import { createCrudService } from './_base';
import type { Transaction, TransactionStatus, TransactionType } from '@/types/api';

export interface TransactionPayload {
  date: string;
  referenceMonth?: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  status?: TransactionStatus;
  recurrenceType?: 'none' | 'monthly' | 'yearly';
  accountId?: string;
  categoryId?: string;
  invoiceId?: string;
  notes?: string;
}

export const transactionsService = createCrudService<Transaction, TransactionPayload>('/transactions');
