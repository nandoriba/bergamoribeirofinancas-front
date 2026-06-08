<script setup lang="ts">
import { useThemeStore } from '@/stores/theme';

import IconGlyph from '@/components/common/IconGlyph.vue';

const themeStore = useThemeStore();
</script>

<template>
  <button
    class="icon-btn"
    type="button"
    :aria-label="themeStore.isDark ? 'Ativar tema claro' : 'Ativar tema escuro'"
    :title="themeStore.isDark ? 'Ativar tema claro' : 'Ativar tema escuro'"
    @click="themeStore.toggleTheme"
  >
    <IconGlyph :name="themeStore.isDark ? 'sun' : 'moon'" :size="15" />
  </button>
</template>

