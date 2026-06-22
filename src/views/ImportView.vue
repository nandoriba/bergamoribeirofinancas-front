<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

import FormField from '@/components/common/FormField.vue';
import Select from '@/components/common/Select.vue';
import { useAccountsStore } from '@/stores/accounts';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';
import type { PossibleDuplicateDecision } from '@/types/dashboard';

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
const possibleDuplicateDecisions = ref<Record<string, PossibleDuplicateDecision>>({});
const invoiceAdjustmentDecisions = ref<Record<string, boolean>>({});

const creditCardOptions = computed(() => [
  { label: 'Sem cartão selecionado', value: '' },
  ...accountsStore.items
    .filter((account) => account.type === 'credit_card' && account.memberProfileId === authStore.user?.profileId)
    .map((account) => ({ label: account.name, value: account.id })),
]);

const isCreditCardPreview = computed(() => data.value.importPreview.some((row) => row.source === 'nubank_credit_card'));
const possibleDuplicateRows = computed(() => data.value.importPreview.filter((row) => row.status === 'possible_duplicate'));
const pendingPossibleDuplicateCount = computed(
  () => possibleDuplicateRows.value.filter((row) => !possibleDuplicateDecisions.value[row.id]).length,
);
const acceptedPossibleDuplicateRowIds = computed(() =>
  Object.entries(possibleDuplicateDecisions.value)
    .filter(([, decision]) => decision === 'not_duplicate')
    .map(([rowId]) => rowId),
);
const confirmedDuplicateRowIds = computed(() =>
  Object.entries(possibleDuplicateDecisions.value)
    .filter(([, decision]) => decision === 'duplicate')
    .map(([rowId]) => rowId),
);
const invoiceAdjustmentRowIds = computed(() =>
  data.value.importPreview
    .filter(
      (row) =>
        row.invoiceAdjustmentCandidate &&
        (invoiceAdjustmentDecisions.value[row.id] ?? row.invoiceAdjustmentDefault ?? false),
    )
    .map((row) => row.id),
);
const confirmDisabled = computed(
  () => (isCreditCardPreview.value && !selectedAccountId.value) || pendingPossibleDuplicateCount.value > 0,
);
const possibleDuplicateCount = computed(() =>
  data.value.importPreview.filter((row) => row.status === 'possible_duplicate').length,
);
const forcedDuplicateCount = computed(
  () =>
    data.value.importPreview.filter(
      (row) => row.status === 'duplicate' && possibleDuplicateDecisions.value[row.id] === 'not_duplicate',
    ).length,
);
const selectedInvoiceAdjustmentCount = computed(() => invoiceAdjustmentRowIds.value.length);
const cardContextLabel = computed(() =>
  isCreditCardPreview.value ? 'obrigatório para fatura de cartão' : 'opcional para fatura de cartão',
);
const confirmHint = computed(() =>
  isCreditCardPreview.value && !selectedAccountId.value
    ? 'Selecione o cartão desta fatura para confirmar a importação.'
    : pendingPossibleDuplicateCount.value
      ? `Escolha uma decisão para ${pendingPossibleDuplicateCount.value} possível(is) duplicidade(s).`
      : forcedDuplicateCount.value
        ? `${forcedDuplicateCount.value} duplicidade(s) marcada(s) para importação forçada.`
      : selectedInvoiceAdjustmentCount.value
        ? `${selectedInvoiceAdjustmentCount.value} ajuste(s) marcado(s) para compor somente a fatura.`
      : possibleDuplicateCount.value
        ? `${acceptedPossibleDuplicateRowIds.value.length} nova(s) e ${confirmedDuplicateRowIds.value.length} duplicada(s) decididas.`
      : '',
);

onMounted(() => {
  void dashboardStore.refreshDashboard();
  void accountsStore.refresh();
});

watch(
  () =>
    data.value.importPreview.map((row) => ({
      id: row.id,
      invoiceAdjustmentCandidate: row.invoiceAdjustmentCandidate,
      invoiceAdjustmentDefault: row.invoiceAdjustmentDefault,
    })),
  (rows) => {
    const rowIds = rows.map((row) => row.id);
    possibleDuplicateDecisions.value = Object.fromEntries(
      Object.entries(possibleDuplicateDecisions.value).filter(([rowId]) => rowIds.includes(rowId)),
    );

    invoiceAdjustmentDecisions.value = Object.fromEntries(
      data.value.importPreview
        .filter((row) => row.invoiceAdjustmentCandidate)
        .map((row) => [
          row.id,
          invoiceAdjustmentDecisions.value[row.id] ?? Boolean(row.invoiceAdjustmentDefault),
        ]),
    );
  },
  { immediate: true },
);

function decidePossibleDuplicate(rowId: string, decision: PossibleDuplicateDecision) {
  possibleDuplicateDecisions.value = {
    ...possibleDuplicateDecisions.value,
    [rowId]: decision,
  };
}

function decideInvoiceAdjustment(rowId: string, selected: boolean) {
  invoiceAdjustmentDecisions.value = {
    ...invoiceAdjustmentDecisions.value,
    [rowId]: selected,
  };
}

async function confirmImport() {
  if (confirmDisabled.value) {
    toast.error(
      pendingPossibleDuplicateCount.value > 0
        ? 'Confirme as possíveis duplicidades antes de importar'
        : 'Selecione o cartão desta fatura para confirmar a importação',
    );
    return;
  }

  try {
    await dashboardStore.confirmImport(
      selectedAccountId.value,
      acceptedPossibleDuplicateRowIds.value,
      confirmedDuplicateRowIds.value,
      invoiceAdjustmentRowIds.value,
    );
    possibleDuplicateDecisions.value = {};
    invoiceAdjustmentDecisions.value = {};
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
      :possible-duplicate-decisions="possibleDuplicateDecisions"
      :invoice-adjustment-decisions="invoiceAdjustmentDecisions"
      @confirm="confirmImport"
      @discard="discardPreview"
      @select-file="dashboardStore.previewImport"
      @decide-possible-duplicate="decidePossibleDuplicate"
      @decide-invoice-adjustment="decideInvoiceAdjustment"
    />
  </AppShell>
</template>
