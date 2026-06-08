import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { ApiError, apiFetch } from '@/lib/api';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  familyId: string;
  familyName?: string;
  profileId: string;
  themePreference: 'dark' | 'light';
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<SessionUser | null>(null);
  const initialized = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(user.value));

  async function bootstrap() {
    if (initialized.value) return;
    isLoading.value = true;
    try {
      user.value = await apiFetch<SessionUser>('/auth/me');
      error.value = null;
    } catch (err) {
      user.value = null;
      if (!(err instanceof ApiError && err.status === 401)) {
        error.value = err instanceof Error ? err.message : 'Falha ao carregar sessão';
      }
    } finally {
      initialized.value = true;
      isLoading.value = false;
    }
  }

  async function login(email: string, password: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await apiFetch<{ user: SessionUser }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      user.value = response.user;
      initialized.value = true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao entrar';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' });
    user.value = null;
    initialized.value = true;
  }

  return {
    bootstrap,
    error,
    initialized,
    isAuthenticated,
    isLoading,
    login,
    logout,
    user,
  };
});
