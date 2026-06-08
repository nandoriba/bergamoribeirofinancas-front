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
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';

const dashboardStore = useDashboardStore();
const accountsStore = useAccountsStore();
const authStore = useAuthStore();
const confirmDialog = useConfirm();
const toast = useToast();
const { data, error, importLoading } = storeToRefs(dashboardStore);
const selectedAccountId = ref('');

const creditCardOptions = computed(() => [
  { label: 'Sem cartão selecionado', value: '' },
  ...accountsStore.items
    .filter((account) => account.type === 'credit_card' && account.memberProfileId === authStore.user?.profileId)
    .map((account) => ({ label: account.name, value: account.id })),
]);

const isCreditCardPreview = computed(() => data.value.importPreview.some((row) => row.source === 'nubank_credit_card'));
const confirmDisabled = computed(() => isCreditCardPreview.value && !selectedAccountId.value);
const cardContextLabel = computed(() =>
  isCreditCardPreview.value ? 'obrigatório para fatura de cartão' : 'opcional para fatura de cartão',
);
const confirmHint = computed(() =>
  confirmDisabled.value ? 'Selecione o cartão desta fatura para confirmar a importação.' : '',
);

onMounted(() => {
  void dashboardStore.refreshDashboard();
  void accountsStore.refresh();
});

async function confirmImport() {
  if (confirmDisabled.value) {
    toast.error('Selecione o cartão desta fatura para confirmar a importação');
    return;
  }

  try {
    await dashboardStore.confirmImport(selectedAccountId.value);
    toast.success('Importação confirmada');
  } catch {
    toast.error('Não foi possível confirmar a importação');
  }
}

async function discardPreview() {
  if (importLoading.value || data.value.importPreview.length === 0) return;

  const confirmed = await confirmDialog.confirm({
    title: 'Descartar prévia',
    message:
      'Descartar esta prévia de importação? As linhas serão marcadas como ignoradas e não voltarão ao atualizar a tela.',
    confirmLabel: 'Descartar',
    destructive: true,
  });

  if (!confirmed) return;

  try {
    await dashboardStore.discardImportPreview();
    toast.success('Prévia descartada');
  } catch {
    toast.error('Não foi possível descartar a prévia');
  }
}
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
          <span class="meta">{{ cardContextLabel }}</span>
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
      :confirm-disabled="confirmDisabled"
      :confirm-hint="confirmHint"
      @confirm="confirmImport"
      @discard="discardPreview"
      @select-file="dashboardStore.previewImport"
    />
  </AppShell>
</template>
