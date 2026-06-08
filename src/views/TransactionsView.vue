<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

import { useDashboardStore } from '@/stores/dashboard';

import TransactionsGrid from '@/components/dashboard/TransactionsGrid.vue';
import AppShell from '@/components/layout/AppShell.vue';

const dashboardStore = useDashboardStore();
const { data } = storeToRefs(dashboardStore);

onMounted(() => {
  void dashboardStore.refreshDashboard();
});
</script>

<template>
  <AppShell>
    <TransactionsGrid :items="data.transactions" />
  </AppShell>
</template>
