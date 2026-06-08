import { createCrudService } from './_base';
import type { Account, AccountType } from '@/types/api';

export interface AccountPayload {
  name: string;
  type: AccountType;
  institution?: string;
  lastFourDigits?: string;
  closingDay?: number;
  dueDay?: number;
  initialBalanceCents?: number;
}

export const accountsService = createCrudService<Account, AccountPayload>('/accounts');
