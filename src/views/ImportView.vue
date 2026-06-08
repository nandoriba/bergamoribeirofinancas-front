<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

import FormField from '@/components/common/FormField.vue';
import Select from '@/components/common/Select.vue';
import { useAccountsStore } from '@/stores/accounts';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';

import ImportReview from '@/components/import/ImportReview.vue';
import AppShell from '@/components/layout/AppShell.vue';

const dashboardStore = useDashboardStore();
const accountsStore = useAccountsStore();
const authStore = useAuthStore();
const { data, error, importLoading } = storeToRefs(dashboardStore);
const selectedAccountId = ref('');

const creditCardOptions = computed(() => [
  { label: 'Sem cartão selecionado', value: '' },
  ...accountsStore.items
    .filter((account) => account.type === 'credit_card' && account.memberProfileId === authStore.user?.profileId)
    .map((account) => ({ label: account.name, value: account.id })),
]);

onMounted(() => {
  void dashboardStore.refreshDashboard();
  void accountsStore.refresh();
});
</script>

<template>
  <AppShell>
    <div v-if="error" class="state-banner error" role="alert">
      {{ error }}
    </div>

    <section class="data-surface">
      <div class="section-head">
        <div>
          <h2>Contexto da importação</h2>
          <span class="meta">opcional para fatura de cartão</span>
        </div>
      </div>
      <div class="filter-strip">
        <FormField label="Cartão">
          <Select v-model="selectedAccountId" :options="creditCardOptions" />
        </FormField>
      </div>
    </section>

    <ImportReview
      :rows="data.importPreview"
      :loading="importLoading"
      @confirm="dashboardStore.confirmImport(selectedAccountId)"
      @discard="dashboardStore.discardImportPreview"
      @select-file="dashboardStore.previewImport"
    />
  </AppShell>
</template>
