import { defineStore } from 'pinia';
import { ref } from 'vue';

import { installmentsService, type InstallmentPayload } from '@/services/installments';
import type { InstallmentPlanWithComputed, InstallmentSummary } from '@/types/api';

const emptySummary: InstallmentSummary = {
  totalPurchaseCents: 0,
  totalInstallments: 0,
  totalAmountToPayCents: 0,
};

export const useInstallmentsStore = defineStore('installments', () => {
  const items = ref<InstallmentPlanWithComputed[]>([]);
  const summary = ref<InstallmentSummary>({ ...emptySummary });
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function refresh() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await installmentsService.list();
      items.value = response.items;
      summary.value = response.summary;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao carregar parcelamentos';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function mutate<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    isLoading.value = true;
    error.value = null;
    try {
      return await operation();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao salvar parcelamento';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    create: (payload: InstallmentPayload) => mutate(() => installmentsService.create(payload)),
    error,
    isLoading,
    items,
    refresh,
    remove: (id: string) => mutate(() => installmentsService.remove(id)),
    summary,
    update: (id: string, payload: Partial<InstallmentPayload>) => mutate(() => installmentsService.update(id, payload)),
  };
});
