import { defineStore } from 'pinia';

import { useCrudResource } from '@/composables/useCrudResource';
import { transactionsService, type TransactionPayload } from '@/services/transactions';
import type { Transaction } from '@/types/api';

export const useTransactionsStore = defineStore('transactions', () => {
  const resource = useCrudResource<Transaction, TransactionPayload>({ service: transactionsService });
  return resource;
});
