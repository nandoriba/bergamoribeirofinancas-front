import { createCrudService } from './_base';
import type { RecurringStatus, RecurringTemplate, TransactionType } from '@/types/api';

export interface RecurringPayload {
  description: string;
  amountCents: number;
  type: TransactionType;
  dayOfMonth: number;
  startsAt: string;
  endsAt?: string;
  status?: RecurringStatus;
  accountId?: string;
  categoryId?: string;
}

export const recurringService = createCrudService<RecurringTemplate, RecurringPayload>('/recurring');
