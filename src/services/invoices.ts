import { createCrudService } from './_base';
import type { Invoice, InvoiceStatus } from '@/types/api';

export interface InvoicePayload {
  referenceMonth: string;
  dueDate?: string;
  closingDate?: string;
  totalCents?: number;
  status?: InvoiceStatus;
  accountId: string;
}

export const invoicesService = createCrudService<Invoice, InvoicePayload>('/invoices');
