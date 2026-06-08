<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

import DataTable from '@/components/common/DataTable.vue';
import IconGlyph from '@/components/common/IconGlyph.vue';
import Modal from '@/components/common/Modal.vue';
import InstallmentForm from '@/components/forms/InstallmentForm.vue';
import AppShell from '@/components/layout/AppShell.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import { ApiError } from '@/lib/api';
import { type InstallmentLinkCandidate } from '@/services/installments';
import { useAccountsStore } from '@/stores/accounts';
import { useAuthStore } from '@/stores/auth';
import { useCategoriesStore } from '@/stores/categories';
import { useDashboardStore } from '@/stores/dashboard';
import { useInstallmentsStore } from '@/stores/installments';
import { useInvoicesStore } from '@/stores/invoices';
import type { InstallmentPlan } from '@/types/api';
import { formatCurrency } from '@/utils/format';

const accountsStore = useAccountsStore();
const authStore = useAuthStore();
const categoriesStore = useCategoriesStore();
const dashboardStore = useDashboardStore();
const installmentsStore = useInstallmentsStore();
const invoicesStore = useInvoicesStore();
const confirmDialog = useConfirm();
const toast = useToast();

const { error, isLoading, items } = storeToRefs(installmentsStore);
const editing = ref<InstallmentPlan | null>(null);
const expandedId = ref<string | null>(null);
const modalOpen = ref(false);

const columns = [
  { key: 'description', label: 'Descrição' },
  { key: 'firstReferenceMonth', label: 'Início econômico' },
  { key: 'paidInstallments', label: 'Pagas' },
  { key: 'totalInstallments', label: 'Total' },
  { key: 'monthlyAmountCents', label: 'Parcela', align: 'right' as const },
  { key: 'totalAmountCents', label: 'Compra', align: 'right' as const },
];

const ownAccounts = computed(() =>
  accountsStore.items.filter((account) => account.memberProfileId === authStore.user?.profileId),
);

const ownInvoices = computed(() =>
  invoicesStore.items.filter((invoice) => invoice.memberProfileId === authStore.user?.profileId),
);

onMounted(async () => {
  await Promise.all([
    accountsStore.refresh(),
    categoriesStore.refresh(),
    invoicesStore.refresh(),
    installmentsStore.refresh(),
  ]);
});

function openCreate() {
  editing.value = null;
  modalOpen.value = true;
}

function openEdit(plan: InstallmentPlan) {
  editing.value = plan;
  modalOpen.value = true;
}

async function save(payload: Parameters<typeof installmentsStore.create>[0]) {
  try {
    if (editing.value) {
      await installmentsStore.update(editing.value.id, payload);
      toast.success('Parcelamento atualizado');
    } else {
      await createWithCandidateConfirmation(payload);
      toast.success('Parcelamento criado e parcelas materializadas');
    }
    modalOpen.value = false;
    await Promise.all([installmentsStore.refresh(), invoicesStore.refresh(), dashboardStore.refreshDashboard()]);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao salvar parcelamento');
  }
}

async function createWithCandidateConfirmation(payload: Parameters<typeof installmentsStore.create>[0]) {
  try {
    await installmentsStore.create(payload);
  } catch (err) {
    const candidates = extractCandidates(err);
    if (!candidates.length) throw err;

    const confirmed = await confirmDialog.confirm({
      title: 'Vincular lançamento existente',
      message: buildCandidateMessage(candidates),
      confirmLabel: 'Vincular',
    });
    if (!confirmed) throw err;
    await installmentsStore.create({ ...payload, confirmExistingLinks: true });
  }
}

async function remove(plan: InstallmentPlan) {
  const confirmed = await confirmDialog.confirm({
    title: 'Excluir parcelamento',
    message: `Excluir "${plan.description}"? As parcelas geradas permanecem como lançamentos simples.`,
    confirmLabel: 'Excluir',
    destructive: true,
  });
  if (!confirmed) return;
  try {
    await installmentsStore.remove(plan.id);
    toast.success('Parcelamento excluído');
    await Promise.all([installmentsStore.refresh(), invoicesStore.refresh(), dashboardStore.refreshDashboard()]);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao excluir parcelamento');
  }
}

function toggle(plan: InstallmentPlan) {
  expandedId.value = expandedId.value === plan.id ? null : plan.id;
}

function extractCandidates(err: unknown): InstallmentLinkCandidate[] {
  if (!(err instanceof ApiError)) return [];
  const details = err.details as { candidates?: InstallmentLinkCandidate[]; message?: { candidates?: InstallmentLinkCandidate[] } };
  return details?.candidates ?? details?.message?.candidates ?? [];
}

function buildCandidateMessage(candidates: InstallmentLinkCandidate[]) {
  const first = candidates[0];
  return `"${first.description}" (${formatCurrency(first.amountCents)}) será vinculado como parcela ${first.installmentNumber}.`;
}

function formatMonth(value: string) {
  const [year, month] = value.slice(0, 7).split('-');
  return `${month}/${year}`;
}
</script>

<template>
  <AppShell>
    <section class="data-surface">
      <div class="section-head">
        <div>
          <h2>Parcelamentos</h2>
          <span class="meta">{{ items.length }} planos familiares</span>
        </div>
        <button class="primary-btn" type="button" @click="openCreate">
          <IconGlyph name="plus" />
          Novo parcelamento
        </button>
      </div>

      <div v-if="error" class="state-banner error" role="alert">
        {{ error }}
      </div>
      <div v-else-if="isLoading" class="state-banner">
        Carregando parcelamentos...
      </div>

      <DataTable :columns="columns" :items="items" empty-label="Nenhum parcelamento cadastrado">
        <template #cell-description="{ item }">
          <span class="strong">{{ item.description }}</span>
        </template>
        <template #cell-firstReferenceMonth="{ item }">
          {{ formatMonth(item.firstReferenceMonth) }}
        </template>
        <template #cell-paidInstallments="{ item }">
          {{ item.paidInstallments }}
        </template>
        <template #cell-totalInstallments="{ item }">
          {{ item.totalInstallments }}
        </template>
        <template #cell-monthlyAmountCents="{ item }">
          {{ formatCurrency(item.monthlyAmountCents) }}
        </template>
        <template #cell-totalAmountCents="{ item }">
          {{ formatCurrency(item.totalAmountCents) }}
        </template>
        <template #actions="{ item }">
          <div class="row-actions">
            <button class="quiet-btn" type="button" @click="toggle(item)">
              {{ expandedId === item.id ? 'Ocultar' : 'Parcelas' }}
            </button>
            <button class="quiet-btn" type="button" @click="openEdit(item)">
              Editar
            </button>
            <button class="quiet-btn" type="button" @click="remove(item)">
              Excluir
            </button>
          </div>
        </template>
      </DataTable>

      <div v-if="expandedId" class="invoice-detail">
        <template v-for="plan in items" :key="plan.id">
          <div v-if="plan.id === expandedId" class="detail-panel">
            <div class="detail-head">
              <div>
                <strong>{{ plan.description }}</strong>
                <span>{{ plan.transactions?.length ?? 0 }} parcelas materializadas</span>
              </div>
              <div class="num">{{ formatCurrency(plan.totalAmountCents) }}</div>
            </div>

            <div v-for="transaction in plan.transactions" :key="transaction.id" class="purchase-row">
              <div>
                <strong>{{ transaction.description }}</strong>
                <span>
                  {{ formatMonth(transaction.referenceMonth) }} · {{ transaction.invoice?.account?.name ?? transaction.account?.name ?? 'Sem conta' }}
                </span>
              </div>
              <div class="purchase-meta">
                <span class="status-badge" :class="transaction.status">{{ transaction.status }}</span>
                <span class="num expense">-{{ formatCurrency(Math.abs(transaction.amountCents)) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <Modal
      :open="modalOpen"
      :title="editing ? 'Editar parcelamento' : 'Novo parcelamento'"
      @close="modalOpen = false"
    >
      <InstallmentForm
        :key="editing?.id ?? 'new'"
        :initial="editing"
        :accounts="ownAccounts"
        :categories="categoriesStore.items"
        :invoices="ownInvoices"
        :loading="isLoading"
        @cancel="modalOpen = false"
        @submit="save"
      />
    </Modal>
  </AppShell>
</template>
