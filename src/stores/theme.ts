import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import type { ThemeName } from '@/types/dashboard';

const STORAGE_KEY = 'financeiro-theme';

function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'light' ? 'light' : 'dark';
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeName>(getInitialTheme());
  const isDark = computed(() => theme.value === 'dark');

  function setTheme(nextTheme: ThemeName) {
    theme.value = nextTheme;
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  }

  watch(
    theme,
    (nextTheme) => {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', nextTheme);
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
      }
    },
    { immediate: true },
  );

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
});

