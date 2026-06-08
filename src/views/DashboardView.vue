<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

import { useDashboardStore } from '@/stores/dashboard';

import AlertsPanel from '@/components/dashboard/AlertsPanel.vue';
import BalanceCompositionCharts from '@/components/dashboard/BalanceCompositionCharts.vue';
import DonutChart from '@/components/dashboard/DonutChart.vue';
import InstallmentsPanel from '@/components/dashboard/InstallmentsPanel.vue';
import KpiGrid from '@/components/dashboard/KpiGrid.vue';
import TopCategoriesPanel from '@/components/dashboard/TopCategoriesPanel.vue';
import AppShell from '@/components/layout/AppShell.vue';

const dashboardStore = useDashboardStore();
const { data, error, isLoading } = storeToRefs(dashboardStore);

onMounted(() => {
  void dashboardStore.refreshDashboard();
});
</script>

<template>
  <AppShell>
    <div v-if="error" class="state-banner error" role="alert">
      {{ error }}
    </div>
    <div v-else-if="isLoading" class="state-banner">
      Carregando balanço...
    </div>

    <KpiGrid :data="data" />

    <section class="mid-grid dashboard-summary-grid" aria-label="Gráficos do balanço">
      <DonutChart :data="data" />
      <BalanceCompositionCharts :data="data" />
    </section>

    <section class="bottom-grid" aria-label="Resumo operacional">
      <TopCategoriesPanel :data="data" />
      <AlertsPanel :items="data.avisos" />
      <InstallmentsPanel :items="data.parcelas" />
    </section>
  </AppShell>
</template>
