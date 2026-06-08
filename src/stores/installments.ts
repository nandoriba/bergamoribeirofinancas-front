import { defineStore } from 'pinia';

import { useCrudResource } from '@/composables/useCrudResource';
import { installmentsService, type InstallmentPayload } from '@/services/installments';
import type { InstallmentPlan } from '@/types/api';

export const useInstallmentsStore = defineStore('installments', () => {
  const resource = useCrudResource<InstallmentPlan, InstallmentPayload>({ service: installmentsService });
  return resource;
});
