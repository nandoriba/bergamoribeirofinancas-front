import { defineStore } from 'pinia';

import { useCrudResource } from '@/composables/useCrudResource';
import { invoicesService, type InvoicePayload } from '@/services/invoices';
import type { Invoice } from '@/types/api';

export const useInvoicesStore = defineStore('invoices', () => {
  const resource = useCrudResource<Invoice, InvoicePayload>({ service: invoicesService });
  return resource;
});
