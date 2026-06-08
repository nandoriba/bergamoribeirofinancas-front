<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';

import FutureBadge from '@/components/common/FutureBadge.vue';
import IconGlyph from '@/components/common/IconGlyph.vue';
import MonthSelector from '@/components/layout/MonthSelector.vue';
import ThemeToggle from '@/components/layout/ThemeToggle.vue';

defineEmits<{
  openMenu: [];
}>();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();

const fallbackTitles: Record<string, string> = {
  faturas: 'Faturas',
  recorrentes: 'Recorrentes',
  parcelamentos: 'Parcelamentos',
  categorias: 'Categorias',
  contas: 'Contas',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
};

const pageTitle = computed(() => {
  const metaTitle = route.meta.title;
  if (typeof metaTitle === 'string') {
    return metaTitle;
  }

  const section = String(route.params.section ?? '');
  return fallbackTitles[section] ?? 'Balanço';
});

async function logout() {
  await authStore.logout();
  await router.replace('/login');
}
</script>

<template>
  <header class="topbar">
    <button class="menu-btn" type="button" aria-label="Abrir navegação" @click="$emit('openMenu')">
      <IconGlyph name="menu" :size="17" />
    </button>

    <div class="crumbs">
      <h1 class="h">
        {{ pageTitle }}
      </h1>
      <span class="sub">· visão do mês selecionado</span>
    </div>

    <button class="search" type="button" aria-label="Buscar lançamento ou categoria">
      <IconGlyph name="search" :size="14" />
      <span>Buscar lançamento, categoria...</span>
      <kbd>Ctrl K</kbd>
    </button>

    <MonthSelector
      :label="dashboardStore.monthLabel"
      @previous="dashboardStore.previousMonth"
      @next="dashboardStore.nextMonth"
    />
    <FutureBadge v-if="dashboardStore.isFutureMonth" />

    <button class="icon-btn" type="button" aria-label="Notificações" title="Notificações">
      <IconGlyph name="bell" :size="15" />
    </button>
    <button class="quiet-btn topbar-logout" type="button" @click="logout">
      Sair
    </button>
    <ThemeToggle />
  </header>
</template>
