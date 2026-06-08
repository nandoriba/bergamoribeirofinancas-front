<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

import DataTable from '@/components/common/DataTable.vue';
import DateInput from '@/components/common/DateInput.vue';
import FormField from '@/components/common/FormField.vue';
import FutureBadge from '@/components/common/FutureBadge.vue';
import IconGlyph from '@/components/common/IconGlyph.vue';
import Modal from '@/components/common/Modal.vue';
import Select from '@/components/common/Select.vue';
import InvoiceForm from '@/components/forms/InvoiceForm.vue';
import AppShell from '@/components/layout/AppShell.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import { useAccountsStore } from '@/stores/accounts';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';
import { useInvoicesStore } from '@/stores/invoices';
import { INVOICE_STATUS_LABELS, type Invoice, type Transaction } from '@/types/api';
import { formatCurrency } from '@/utils/format';

const accountsStore = useAccountsStore();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();
const invoicesStore = useInvoicesStore();
const confirmDialog = useConfirm();
const toast = useToast();

const { items, isLoading, error } = storeToRefs(invoicesStore);
const accountFilter = ref('');
const editing = ref<Invoice | null>(null);
const expandedId = ref<string | null>(null);
const modalOpen = ref(false);

const columns = [
  { key: 'referenceMonth', label: 'Mês' },
  { key: 'account', label: 'Cartão' },
  { key: 'status', label: 'Status' },
  { key: 'transactions', label: 'Compras', align: 'right' as const },
  { key: 'subtotal', label: 'Subtotal', align: 'right' as const },
  { key: 'totalCents', label: 'Valor fechado', align: 'right' as const },
  { key: 'dueDate', label: 'Vencimento' },
];

const ownCards = computed(() =>
  accountsStore.items.filter(
    (account) => account.type === 'credit_card' && account.memberProfileId === authStore.user?.profileId,
  ),
);

const cardFilterOptions = computed(() => [
  { label: 'Todos os cartões', value: '' },
  ...accountsStore.items
    .filter((account) => account.type === 'credit_card')
    .map((account) => ({
      label: `${account.name}${account.memberProfile?.displayName ? ` · ${account.memberProfile.displayName}` : ''}`,
      value: account.id,
    })),
]);

const filteredInvoices = computed(() =>
  items.value.filter((invoice) => {
    const sameMonth = monthValue(invoice.referenceMonth) === dashboardStore.selectedMonth;
    const sameCard = !accountFilter.value || invoice.accountId === accountFilter.value;
    return sameMonth && sameCard;
  }),
);

onMounted(async () => {
  await Promise.all([accountsStore.refresh(), invoicesStore.refresh()]);
});

function openCreate() {
  editing.value = null;
  modalOpen.value = true;
}

function openEdit(invoice: Invoice) {
  editing.value = invoice;
  modalOpen.value = true;
}

async function save(payload: Parameters<typeof invoicesStore.create>[0]) {
  try {
    if (editing.value) {
      await invoicesStore.update(editing.value.id, payload);
      toast.success('Fatura atualizada');
    } else {
      await invoicesStore.create(payload);
      toast.success('Fatura criada no seu perfil');
    }
    modalOpen.value = false;
    await invoicesStore.refresh();
    await dashboardStore.refreshDashboard();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao salvar fatura');
  }
}

async function markAsPaid(invoice: Invoice) {
  try {
    await invoicesStore.update(invoice.id, { status: 'paid', accountId: invoice.accountId, referenceMonth: invoice.referenceMonth });
    toast.success('Fatura marcada como paga');
    await invoicesStore.refresh();
    await dashboardStore.refreshDashboard();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao pagar fatura');
  }
}

async function remove(invoice: Invoice) {
  const confirmed = await confirmDialog.confirm({
    title: 'Excluir fatura',
    message: `Excluir a fatura de ${invoice.account?.name ?? 'cartão'} em ${formatMonth(invoice.referenceMonth)}?`,
    confirmLabel: 'Excluir',
    destructive: true,
  });
  if (!confirmed) return;
  try {
    await invoicesStore.remove(invoice.id);
    toast.success('Fatura excluída');
    await invoicesStore.refresh();
    await dashboardStore.refreshDashboard();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao excluir fatura');
  }
}

function toggle(invoice: Invoice) {
  expandedId.value = expandedId.value === invoice.id ? null : invoice.id;
}

function subtotal(invoice: Invoice) {
  return (invoice.transactions ?? []).reduce((sum, transaction) => sum + Math.abs(transaction.amountCents), 0);
}

function isProjected(invoice: Invoice) {
  const transactions = invoice.transactions ?? [];
  return (
    invoice.status === 'open' &&
    monthValue(invoice.referenceMonth) > currentMonth() &&
    transactions.length > 0 &&
    transactions.every((transaction) => transaction.installmentNumber)
  );
}

function timeline(transaction: Transaction) {
  return transaction.installmentPlan?.transactions ?? [];
}

function monthValue(value: string) {
  return value.slice(0, 7);
}

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(value: string) {
  const [year, month] = monthValue(value).split('-');
  return `${month}/${year}`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Não definido';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
</script>

<template>
  <AppShell>
    <section class="data-surface">
      <div class="section-head">
        <div>
          <h2>Faturas</h2>
          <span class="meta">{{ filteredInvoices.length }} faturas no mês</span>
        </div>
        <button class="primary-btn" type="button" @click="openCreate">
          <IconGlyph name="plus" />
          Nova fatura
        </button>
      </div>

      <div class="filter-strip">
        <FormField label="Mês">
          <DateInput v-model="dashboardStore.selectedMonth" type="month" />
        </FormField>
        <FormField label="Cartão">
          <Select v-model="accountFilter" :options="cardFilterOptions" />
        </FormField>
      </div>

      <div v-if="error" class="state-banner error" role="alert">
        {{ error }}
      </div>
      <div v-else-if="isLoading" class="state-banner">
        Carregando faturas...
      </div>

      <DataTable :columns="columns" :items="filteredInvoices" empty-label="Nenhuma fatura no mês selecionado">
        <template #cell-referenceMonth="{ item }">
          <span class="strong">{{ formatMonth(item.referenceMonth) }}</span>
          <FutureBadge v-if="isProjected(item)" label="Projetada" />
        </template>
        <template #cell-account="{ item }">
          {{ item.account?.name ?? 'Cartão' }}
          <span v-if="item.account?.memberProfile?.displayName" class="muted"> · {{ item.account.memberProfile.displayName }}</span>
        </template>
        <template #cell-status="{ item }">
          <span class="status-badge" :class="item.status">{{ INVOICE_STATUS_LABELS[item.status] }}</span>
        </template>
        <template #cell-transactions="{ item }">
          {{ item.transactions?.length ?? 0 }}
        </template>
        <template #cell-subtotal="{ item }">
          {{ formatCurrency(subtotal(item)) }}
        </template>
        <template #cell-totalCents="{ item }">
          {{ formatCurrency(item.totalCents) }}
        </template>
        <template #cell-dueDate="{ item }">
          {{ formatDate(item.dueDate) }}
        </template>
        <template #actions="{ item }">
          <div class="row-actions">
            <button class="quiet-btn" type="button" @click="toggle(item)">
              {{ expandedId === item.id ? 'Ocultar' : 'Compras' }}
            </button>
            <button class="quiet-btn" type="button" @click="openEdit(item)">
              Editar
            </button>
            <button class="quiet-btn" type="button" :disabled="item.status === 'paid'" @click="markAsPaid(item)">
              Pagar
            </button>
            <button class="quiet-btn" type="button" @click="remove(item)">
              Excluir
            </button>
          </div>
        </template>
      </DataTable>

      <div v-if="expandedId" class="invoice-detail">
        <template v-for="invoice in filteredInvoices" :key="invoice.id">
          <div v-if="invoice.id === expandedId" class="detail-panel">
            <div class="detail-head">
              <div>
                <strong>{{ invoice.account?.name ?? 'Fatura' }} · {{ formatMonth(invoice.referenceMonth) }}</strong>
                <span>{{ invoice.transactions?.length ?? 0 }} compras vinculadas</span>
              </div>
              <div class="num">{{ formatCurrency(subtotal(invoice)) }}</div>
            </div>

            <div v-if="!invoice.transactions?.length" class="empty-panel">
              Nenhuma compra vinculada a esta fatura.
            </div>

            <div v-for="transaction in invoice.transactions" v-else :key="transaction.id" class="purchase-row">
              <div>
                <strong>{{ transaction.description }}</strong>
                <span>
                  {{ formatDate(transaction.date) }} · {{ transaction.category?.name ?? 'Sem categoria' }} ·
                  {{ transaction.memberProfile?.displayName ?? 'Perfil' }}
                </span>
              </div>
              <div class="purchase-meta">
                <span v-if="transaction.installmentNumber" class="status-badge pending">
                  Parcela {{ transaction.installmentNumber }}/{{ transaction.installmentPlan?.totalInstallments ?? '?' }}
                </span>
                <span class="num expense">-{{ formatCurrency(Math.abs(transaction.amountCents)) }}</span>
              </div>

              <div v-if="timeline(transaction).length > 1" class="timeline">
                <span v-for="item in timeline(transaction)" :key="item.id" class="timeline-chip">
                  {{ item.installmentNumber }}/{{ transaction.installmentPlan?.totalInstallments }} ·
                  {{ formatMonth(item.referenceMonth) }}
                  <span v-if="item.invoice?.account?.name"> · {{ item.invoice.account.name }}</span>
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <Modal :open="modalOpen" :title="editing ? 'Editar fatura' : 'Nova fatura'" @close="modalOpen = false">
      <InvoiceForm
        :key="editing?.id ?? 'new'"
        :initial="editing"
        :accounts="ownCards"
        :loading="isLoading"
        @cancel="modalOpen = false"
        @submit="save"
      />
    </Modal>
  </AppShell>
</template>
