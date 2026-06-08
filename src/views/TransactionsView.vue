<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

import DataTable from '@/components/common/DataTable.vue';
import FormField from '@/components/common/FormField.vue';
import FutureBadge from '@/components/common/FutureBadge.vue';
import IconGlyph from '@/components/common/IconGlyph.vue';
import Modal from '@/components/common/Modal.vue';
import Select from '@/components/common/Select.vue';
import TransactionForm from '@/components/forms/TransactionForm.vue';
import AppShell from '@/components/layout/AppShell.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import { useAccountsStore } from '@/stores/accounts';
import { useAuthStore } from '@/stores/auth';
import { useCategoriesStore } from '@/stores/categories';
import { useDashboardStore } from '@/stores/dashboard';
import { useInvoicesStore } from '@/stores/invoices';
import { useProfilesStore } from '@/stores/profiles';
import { useTransactionsStore } from '@/stores/transactions';
import {
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  type Transaction,
} from '@/types/api';
import { formatCurrency } from '@/utils/format';

const accountsStore = useAccountsStore();
const authStore = useAuthStore();
const categoriesStore = useCategoriesStore();
const dashboardStore = useDashboardStore();
const invoicesStore = useInvoicesStore();
const profilesStore = useProfilesStore();
const transactionsStore = useTransactionsStore();
const confirmDialog = useConfirm();
const toast = useToast();

const { error, isLoading, items } = storeToRefs(transactionsStore);
const categoryFilter = ref('');
const profileFilter = ref('');
const editing = ref<Transaction | null>(null);
const modalOpen = ref(false);

const columns = [
  { key: 'applicationDate', label: 'Aplicação' },
  { key: 'referenceMonth', label: 'Referência' },
  { key: 'date', label: 'Escrituração' },
  { key: 'description', label: 'Descrição' },
  { key: 'account', label: 'Conta' },
  { key: 'category', label: 'Categoria' },
  { key: 'memberProfile', label: 'Perfil' },
  { key: 'status', label: 'Status' },
  { key: 'amountCents', label: 'Valor', align: 'right' as const },
];

const ownAccounts = computed(() =>
  accountsStore.items.filter((account) => account.memberProfileId === authStore.user?.profileId),
);

const ownInvoices = computed(() =>
  invoicesStore.items.filter((invoice) => invoice.memberProfileId === authStore.user?.profileId),
);

const profileOptions = computed(() => [
  { label: 'Todos os perfis', value: '' },
  ...profilesStore.items.map((profile) => ({ label: profile.displayName, value: profile.id })),
]);

const categoryOptions = computed(() => [
  { label: 'Todas as categorias', value: '' },
  ...categoriesStore.items.map((category) => ({ label: category.name, value: category.id })),
]);

const filteredItems = computed(() =>
  items.value.filter((transaction) => {
    const profileMatch = !profileFilter.value || transaction.memberProfileId === profileFilter.value;
    const categoryMatch = !categoryFilter.value || transaction.categoryId === categoryFilter.value;
    return profileMatch && categoryMatch;
  }),
);

const isFutureMonth = computed(() => dashboardStore.isFutureMonth);

onMounted(async () => {
  await Promise.all([
    accountsStore.refresh(),
    categoriesStore.refresh(),
    invoicesStore.refresh(),
    profilesStore.refresh(),
    refreshTransactions(),
  ]);
});

watch(
  () => dashboardStore.selectedMonth,
  () => {
    void refreshTransactions();
  },
);

async function refreshTransactions() {
  await transactionsStore.refresh({ referenceMonth: dashboardStore.selectedMonth });
}

function openCreate() {
  editing.value = null;
  modalOpen.value = true;
}

function openEdit(transaction: Transaction) {
  if (!canMutate(transaction)) return;
  editing.value = transaction;
  modalOpen.value = true;
}

async function save(payload: Parameters<typeof transactionsStore.create>[0]) {
  try {
    if (editing.value) {
      await transactionsStore.update(editing.value.id, payload);
      toast.success('Lançamento atualizado');
    } else {
      await transactionsStore.create(payload);
      toast.success('Lançamento criado no seu perfil');
    }
    modalOpen.value = false;
    await Promise.all([refreshTransactions(), invoicesStore.refresh(), dashboardStore.refreshDashboard()]);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao salvar lançamento');
  }
}

async function remove(transaction: Transaction) {
  if (!canMutate(transaction)) return;
  const confirmed = await confirmDialog.confirm({
    title: 'Excluir lançamento',
    message: `Excluir "${transaction.description}"?`,
    confirmLabel: 'Excluir',
    destructive: true,
  });
  if (!confirmed) return;
  try {
    await transactionsStore.remove(transaction.id);
    toast.success('Lançamento excluído');
    await Promise.all([refreshTransactions(), invoicesStore.refresh(), dashboardStore.refreshDashboard()]);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao excluir lançamento');
  }
}

function canMutate(transaction: Transaction) {
  return transaction.memberProfileId === authStore.user?.profileId;
}

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
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
          <h2>Lançamentos</h2>
          <span class="meta">{{ filteredItems.length }} itens na referência</span>
        </div>
        <button class="primary-btn" type="button" @click="openCreate">
          <IconGlyph name="plus" />
          Novo lançamento
        </button>
      </div>

      <div class="filter-strip">
        <FormField label="Perfil">
          <Select v-model="profileFilter" :options="profileOptions" />
        </FormField>
        <FormField label="Categoria">
          <Select v-model="categoryFilter" :options="categoryOptions" />
        </FormField>
        <div v-if="isFutureMonth" class="filter-badge">
          <FutureBadge />
        </div>
      </div>

      <div v-if="error" class="state-banner error" role="alert">
        {{ error }}
      </div>
      <div v-else-if="isLoading" class="state-banner">
        Carregando lançamentos...
      </div>

      <DataTable :columns="columns" :items="filteredItems" empty-label="Nenhum lançamento na referência selecionada">
        <template #cell-applicationDate="{ item }">
          <span class="num">{{ formatDate(item.applicationDate) }}</span>
        </template>
        <template #cell-date="{ item }">
          <span class="num">{{ formatDate(item.date) }}</span>
        </template>
        <template #cell-referenceMonth="{ item }">
          <span class="num">{{ formatMonth(item.referenceMonth) }}</span>
          <span v-if="item.installmentNumber" class="status-badge pending">
            Parcela {{ item.installmentNumber }}/{{ item.installmentPlan?.totalInstallments ?? '?' }}
          </span>
        </template>
        <template #cell-description="{ item }">
          <span class="strong">{{ item.description }}</span>
          <span v-if="item.invoice?.id" class="muted"> · fatura</span>
        </template>
        <template #cell-account="{ item }">
          {{ item.account?.name ?? 'Sem conta' }}
        </template>
        <template #cell-category="{ item }">
          {{ item.category?.name ?? 'Sem categoria' }}
        </template>
        <template #cell-memberProfile="{ item }">
          {{ item.memberProfile?.displayName ?? 'Perfil' }}
        </template>
        <template #cell-status="{ item }">
          <span class="status-badge" :class="item.status">{{ TRANSACTION_STATUS_LABELS[item.status] }}</span>
        </template>
        <template #cell-amountCents="{ item }">
          <span class="num" :class="item.type">
            {{ item.type === 'expense' ? '-' : '+' }}{{ formatCurrency(Math.abs(item.amountCents)) }}
          </span>
        </template>
        <template #actions="{ item }">
          <div v-if="canMutate(item)" class="row-actions">
            <button class="quiet-btn" type="button" @click="openEdit(item)">
              Editar
            </button>
            <button class="quiet-btn" type="button" @click="remove(item)">
              Excluir
            </button>
          </div>
          <span v-else class="muted">Somente leitura</span>
        </template>
      </DataTable>
    </section>

    <Modal :open="modalOpen" :title="editing ? 'Editar lançamento' : 'Novo lançamento'" @close="modalOpen = false">
      <TransactionForm
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
