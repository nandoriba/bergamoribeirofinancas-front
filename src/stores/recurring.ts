import { defineStore } from 'pinia';

import { useCrudResource } from '@/composables/useCrudResource';
import { recurringService, type RecurringPayload } from '@/services/recurring';
import type { RecurringTemplate } from '@/types/api';

export const useRecurringStore = defineStore('recurring', () => {
  const resource = useCrudResource<RecurringTemplate, RecurringPayload>({ service: recurringService });
  return resource;
});
