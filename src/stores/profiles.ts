import { defineStore } from 'pinia';
import { ref } from 'vue';

import { profilesService } from '@/services/profiles';
import type { ProfileSummary } from '@/types/api';

export const useProfilesStore = defineStore('profiles', () => {
  const items = ref<ProfileSummary[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function refresh() {
    isLoading.value = true;
    error.value = null;
    try {
      items.value = await profilesService.list();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao carregar perfis';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return { error, isLoading, items, refresh };
});
