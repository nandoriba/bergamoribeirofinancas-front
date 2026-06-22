import { apiFetch } from '@/lib/api';
import type { InstallmentPlanWithComputed, InstallmentSummary } from '@/types/api';

export interface InstallmentPayload {
  description: string;
  totalInstallments: number;
  firstInstallmentNumber: number;
  paidInstallments?: number;
  monthlyAmountCents: number;
  totalAmountCents: number;
  startsAt: string;
  firstApplicationDate?: string;
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

export interface InstallmentListResponse {
  items: InstallmentPlanWithComputed[];
  summary: InstallmentSummary;
}

export const installmentsService = {
  list: () => apiFetch<InstallmentListResponse>('/installments'),
  create: (payload: InstallmentPayload) =>
    apiFetch<InstallmentPlanWithComputed>('/installments', {
      method: 'POST',
      body: payload as unknown as Record<string, unknown>,
    }),
  update: (id: string, payload: Partial<InstallmentPayload>) =>
    apiFetch<InstallmentPlanWithComputed>(`/installments/${id}`, {
      method: 'PATCH',
      body: payload as unknown as Record<string, unknown>,
    }),
  remove: (id: string) => apiFetch<void>(`/installments/${id}`, { method: 'DELETE' }),
};
