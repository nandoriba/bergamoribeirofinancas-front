import { defineStore } from 'pinia';

import { useCrudResource } from '@/composables/useCrudResource';
import { accountsService, type AccountPayload } from '@/services/accounts';
import type { Account } from '@/types/api';

export const useAccountsStore = defineStore('accounts', () => {
  const resource = useCrudResource<Account, AccountPayload>({ service: accountsService });
  return resource;
});
