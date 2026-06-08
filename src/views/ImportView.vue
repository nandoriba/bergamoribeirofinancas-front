<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

import { useDashboardStore } from '@/stores/dashboard';

import ImportReview from '@/components/import/ImportReview.vue';
import AppShell from '@/components/layout/AppShell.vue';

const dashboardStore = useDashboardStore();
const { data, error, importLoading } = storeToRefs(dashboardStore);

onMounted(() => {
  void dashboardStore.refreshDashboard();
});
</script>

<template>
  <AppShell>
    <div v-if="error" class="state-banner error" role="alert">
      {{ error }}
    </div>
    <ImportReview
      :rows="data.importPreview"
      :loading="importLoading"
      @confirm="dashboardStore.confirmImport"
      @discard="dashboardStore.discardImportPreview"
      @select-file="dashboardStore.previewImport"
    />
  </AppShell>
</template>
