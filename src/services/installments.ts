import { createCrudService } from './_base';
import type { InstallmentPlan } from '@/types/api';

export interface InstallmentPayload {
  description: string;
  totalInstallments: number;
  firstInstallmentNumber: number;
  paidInstallments?: number;
  monthlyAmountCents: number;
  totalAmountCents: number;
  startsAt: string;
  firstReferenceMonth: string;
  accountId?: string;
  categoryId?: string;
  invoiceId?: string;
  confirmExistingLinks?: boolean;
}

export interface InstallmentLinkCandidate {
  candidateTransactionId: string;
  installmentNumber: number;
  referenceMonth: string;
  description: string;
  amountCents: number;
}

export const installmentsService = createCrudService<InstallmentPlan, InstallmentPayload>('/installments');
