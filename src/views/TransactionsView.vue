<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch, type Ref } from 'vue';

import CurrencyInput from '@/components/common/CurrencyInput.vue';
import DataTable from '@/components/common/DataTable.vue';
import DateInput from '@/components/common/DateInput.vue';
import FormField from '@/components/common/FormField.vue';
import FutureBadge from '@/components/common/FutureBadge.vue';
import IconGlyph from '@/components/common/IconGlyph.vue';
import Modal from '@/components/common/Modal.vue';
import MultiSelect from '@/components/common/MultiSelect.vue';
import Select from '@/components/common/Select.vue';
import TransactionForm from '@/components/forms/TransactionForm.vue';
import AppShell from '@/components/layout/AppShell.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import { ApiError } from '@/lib/api';
import type { TransactionPayload } from '@/services/transactions';
import { useAccountsStore } from '@/stores/accounts';
import { useAuthStore } from '@/stores/auth';
import { useCategoriesStore } from '@/stores/categories';
import { useDashboardStore } from '@/stores/dashboard';
import { useInvoicesStore } from '@/stores/invoices';
import { useProfilesStore } from '@/stores/profiles';
import { useTransactionsStore } from '@/stores/transactions';
import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_STATUS_LABELS,
  type Account,
  type Transaction,
  type TransactionType,
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
const selectedTransactionTypeKeys = ref<string[]>([]);
const selectedCategoryKeys = ref<string[]>([]);
const selectedAccountKeys = ref<string[]>([]);
const descriptionFilter = ref('');
const applicationDateFromFilter = ref('');
const applicationDateToFilter = ref('');
const amountFilterCents = ref(0);
const profileFilter = ref('');
const searchMode = ref<SearchMode>('description');
const editing = ref<Transaction | null>(null);
const modalOpen = ref(false);
const duplicateWarning = ref<ManualDuplicateWarning | null>(null);
const pendingDuplicatePayload = ref<TransactionPayload | null>(null);
const sortKey = ref<TransactionSortKey>('applicationDate');
const sortDirection = ref<SortDirection>('desc');

interface ManualDuplicateWarning {
  title: string;
  message: string;
  canOverride: boolean;
}

type SearchMode = 'description' | 'amount' | 'applicationDate';
type TransactionSortKey = 'applicationDate' | 'amountCents';
type SortDirection = 'asc' | 'desc';

const columns = [
  { key: 'applicationDate', label: 'Data Aplicação', sortable: true },
  { key: 'referenceMonth', label: 'Referência' },
  { key: 'date', label: 'Escrituração' },
  { key: 'description', label: 'Descrição' },
  { key: 'account', label: 'Conta' },
  { key: 'category', label: 'Categoria' },
  { key: 'memberProfile', label: 'Perfil' },
  { key: 'status', label: 'Status' },
  { key: 'amountCents', label: 'Valor', align: 'right' as const, sortable: true },
];

const searchModeOptions: Array<{ label: string; value: SearchMode }> = [
  { label: 'Descrição', value: 'description' },
  { label: 'Valor', value: 'amount' },
  { label: 'Data Aplicação', value: 'applicationDate' },
];

const SPECIAL_OPERATIONAL_CATEGORY_KEYS = new Set(['system:invoice_adjustment', 'system:invoice_payment']);
const UNCATEGORIZED_CATEGORY_KEY = 'system:uncategorized';
const NO_ACCOUNT_KEY = 'system:no_account';

const TRANSACTION_TYPE_FILTER_LABELS: Record<TransactionType, string> = {
  income: 'Entradas (receitas)',
  expense: 'Saídas (despesas)',
  transfer: TRANSACTION_TYPE_LABELS.transfer,
};

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
  ...operationalCategoryOptions.value,
  ...categoriesStore.items.map((category) => ({ label: category.name, value: `category:${category.id}` })),
]);

const operationalCategoryOptions = computed(() => {
  const options = new Map<string, string>();
  for (const transaction of items.value) {
    const key = categoryKey(transaction);
    if (key.startsWith('system:')) {
      options.set(key, categoryLabel(transaction));
    }
  }
  return [...options.entries()]
    .sort(([, a], [, b]) => a.localeCompare(b, 'pt-BR'))
    .map(([value, label]) => ({ label, value }));
});

const transactionTypeOptions = computed(() =>
  TRANSACTION_TYPES.map((value) => ({ label: TRANSACTION_TYPE_FILTER_LABELS[value], value })),
);

const accountOptions = computed(() => {
  const options = new Map<string, string>();
  for (const account of accountsStore.items) {
    options.set(`account:${account.id}`, accountLabel(account));
  }
  for (const transaction of items.value) {
    if (transaction.account) {
      options.set(accountKey(transaction), accountLabel(transaction.account));
    }
  }
  if (items.value.some((transaction) => accountKey(transaction) === NO_ACCOUNT_KEY)) {
    options.set(NO_ACCOUNT_KEY, 'Sem conta');
  }
  return [...options.entries()]
    .sort(([, a], [, b]) => a.localeCompare(b, 'pt-BR'))
    .map(([value, label]) => ({ label, value }));
});

const normalizedDescriptionFilter = computed(() => normalizeSearch(descriptionFilter.value));
const transactionTypeOptionValues = computed(() => transactionTypeOptions.value.map((option) => option.value));
const categoryOptionValues = computed(() => categoryOptions.value.map((option) => option.value));
const accountOptionValues = computed(() => accountOptions.value.map((option) => option.value));
const hasActiveSearch = computed(() => {
  if (searchMode.value === 'amount') return amountFilterCents.value !== 0;
  if (searchMode.value === 'applicationDate') {
    return Boolean(applicationDateFromFilter.value || applicationDateToFilter.value);
  }
  return Boolean(normalizedDescriptionFilter.value);
});

const filteredItems = computed(() =>
  items.value.filter((transaction) => {
    const profileMatch = !profileFilter.value || transaction.memberProfileId === profileFilter.value;
    const transactionTypeMatch = selectedTransactionTypeKeys.value.includes(transaction.type);
    const categoryMatch = selectedCategoryKeys.value.includes(categoryKey(transaction));
    const accountMatch = selectedAccountKeys.value.includes(accountKey(transaction));
    return profileMatch && transactionTypeMatch && categoryMatch && accountMatch && matchesActiveSearch(transaction);
  }),
);
const sortedItems = computed(() => [...filteredItems.value].sort(compareTransactions));
const filteredTotals = computed(() =>
  filteredItems.value.reduce(
    (totals, transaction) => {
      const amount = Math.abs(transaction.amountCents);
      if (transaction.type === 'income') totals.incomeCents += amount;
      if (transaction.type === 'expense') totals.expenseCents += amount;
      if (transaction.type === 'transfer') totals.transferCents += amount;
      totals.netCents = totals.incomeCents - totals.expenseCents;
      return totals;
    },
    { incomeCents: 0, expenseCents: 0, transferCents: 0, netCents: 0 },
  ),
);
const netTotalClass = computed(() => (filteredTotals.value.netCents < 0 ? 'expense' : 'income'));

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

watch(
  categoryOptionValues,
  (nextValues, previousValues = []) => {
    syncSelectedOptionValues(selectedCategoryKeys, nextValues, previousValues);
  },
  { immediate: true },
);

watch(
  transactionTypeOptionValues,
  (nextValues, previousValues = []) => {
    syncSelectedOptionValues(selectedTransactionTypeKeys, nextValues, previousValues);
  },
  { immediate: true },
);

watch(
  accountOptionValues,
  (nextValues, previousValues = []) => {
    syncSelectedOptionValues(selectedAccountKeys, nextValues, previousValues);
  },
  { immediate: true },
);

async function refreshTransactions() {
  await transactionsStore.refresh({ referenceMonth: dashboardStore.selectedMonth });
}

function openCreate() {
  editing.value = null;
  clearDuplicateWarning();
  modalOpen.value = true;
}

function openEdit(transaction: Transaction) {
  if (!canMutate(transaction)) return;
  editing.value = transaction;
  clearDuplicateWarning();
  modalOpen.value = true;
}

async function save(payload: Parameters<typeof transactionsStore.create>[0]) {
  clearDuplicateWarning();
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
    if (!editing.value && isDuplicateError(err)) {
      transactionsStore.clearError();
      pendingDuplicatePayload.value = payload;
      duplicateWarning.value = buildDuplicateWarning(err);
      return;
    }

    toast.error(err instanceof Error ? err.message : 'Falha ao salvar lançamento');
  }
}

async function saveDuplicateOverride() {
  if (!pendingDuplicatePayload.value) return;
  try {
    await transactionsStore.create({ ...pendingDuplicatePayload.value, allowDuplicate: true });
    toast.success('Lançamento criado no seu perfil');
    clearDuplicateWarning();
    modalOpen.value = false;
    await Promise.all([refreshTransactions(), invoicesStore.refresh(), dashboardStore.refreshDashboard()]);
  } catch (err) {
    transactionsStore.clearError();
    toast.error(err instanceof Error ? err.message : 'Falha ao salvar lançamento');
  }
}

function clearDuplicateWarning() {
  duplicateWarning.value = null;
  pendingDuplicatePayload.value = null;
}

function clearActiveSearch() {
  descriptionFilter.value = '';
  amountFilterCents.value = 0;
  applicationDateFromFilter.value = '';
  applicationDateToFilter.value = '';
}

function exportFilteredTransactionsCsv() {
  const rows = sortedItems.value.map((transaction) => [
    formatDate(transaction.applicationDate),
    formatMonth(transaction.referenceMonth),
    formatDate(transaction.date),
    transaction.description,
    TRANSACTION_TYPE_LABELS[transaction.type],
    TRANSACTION_STATUS_LABELS[transaction.status],
    formatCsvAmount(transaction),
    signedAmountCents(transaction),
    transaction.account?.name ?? 'Sem conta',
    categoryLabel(transaction),
    transaction.memberProfile?.displayName ?? 'Perfil',
    transaction.invoice ? formatMonth(transaction.invoice.referenceMonth) : '',
    transaction.installmentNumber
      ? `${transaction.installmentNumber}/${transaction.installmentPlan?.totalInstallments ?? ''}`
      : '',
    transaction.source ?? '',
    transaction.notes ?? '',
  ]);

  const csv = toCsv([
    [
      'Data Aplicação',
      'Referência',
      'Escrituração',
      'Descrição',
      'Tipo',
      'Status',
      'Valor',
      'Valor Centavos',
      'Conta',
      'Categoria',
      'Perfil',
      'Fatura',
      'Parcela',
      'Origem',
      'Notas',
    ],
    ...rows,
  ]);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `lancamentos-${dashboardStore.selectedMonth}-${timestampForFileName()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function setSort(key: string) {
  if (!isTransactionSortKey(key)) return;

  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    return;
  }

  sortKey.value = key;
  sortDirection.value = 'desc';
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

function formatCsvAmount(transaction: Transaction) {
  return (signedAmountCents(transaction) / 100).toFixed(2).replace('.', ',');
}

function signedAmountCents(transaction: Transaction) {
  const amount = Math.abs(transaction.amountCents);
  return transaction.type === 'expense' ? -amount : amount;
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

function matchesActiveSearch(transaction: Transaction) {
  if (searchMode.value === 'amount') {
    return amountFilterCents.value === 0 || Math.abs(transaction.amountCents) === Math.abs(amountFilterCents.value);
  }

  if (searchMode.value === 'applicationDate') {
    return matchesApplicationDateRange(transaction);
  }

  return !normalizedDescriptionFilter.value || normalizeSearch(transaction.description).includes(normalizedDescriptionFilter.value);
}

function matchesApplicationDateRange(transaction: Transaction) {
  const applicationDate = transaction.applicationDate.slice(0, 10);
  const from = applicationDateFromFilter.value;
  const to = applicationDateToFilter.value;

  if (from && to) {
    const start = from <= to ? from : to;
    const end = from <= to ? to : from;
    return applicationDate >= start && applicationDate <= end;
  }

  if (from) return applicationDate >= from;
  if (to) return applicationDate <= to;
  return true;
}

function categoryKey(transaction: Transaction) {
  if (transaction.operationalCategory?.key && SPECIAL_OPERATIONAL_CATEGORY_KEYS.has(transaction.operationalCategory.key)) {
    return transaction.operationalCategory.key;
  }
  if (transaction.categoryId) return `category:${transaction.categoryId}`;
  return UNCATEGORIZED_CATEGORY_KEY;
}

function categoryLabel(transaction: Transaction) {
  if (transaction.operationalCategory?.key && SPECIAL_OPERATIONAL_CATEGORY_KEYS.has(transaction.operationalCategory.key)) {
    return transaction.operationalCategory.name;
  }
  return transaction.category?.name ?? 'Sem categoria';
}

function accountKey(transaction: Transaction) {
  const accountId = transaction.accountId ?? transaction.account?.id;
  return accountId ? `account:${accountId}` : NO_ACCOUNT_KEY;
}

function accountLabel(account: Account) {
  const digits = account.lastFourDigits ? ` · ${account.lastFourDigits}` : '';
  const profile = account.memberProfile?.displayName ? ` · ${account.memberProfile.displayName}` : '';
  return `${account.name}${digits}${profile}`;
}

function syncSelectedOptionValues(selection: Ref<string[]>, nextValues: string[], previousValues: string[] = []) {
  const nextSet = new Set(nextValues);
  const previousSelection = selection.value;
  const hadNoOptions = previousValues.length === 0 && previousSelection.length === 0;
  const hadAllPreviousSelected =
    previousValues.length > 0 && previousValues.every((value) => previousSelection.includes(value));

  if (hadNoOptions || hadAllPreviousSelected) {
    selection.value = nextValues;
    return;
  }

  selection.value = previousSelection.filter((value) => nextSet.has(value));
}

function compareTransactions(a: Transaction, b: Transaction) {
  const direction = sortDirection.value === 'asc' ? 1 : -1;
  const valueA = sortValue(a, sortKey.value);
  const valueB = sortValue(b, sortKey.value);
  const comparison = valueA === valueB ? fallbackSortValue(a) - fallbackSortValue(b) : valueA - valueB;
  return comparison * direction;
}

function sortValue(transaction: Transaction, key: TransactionSortKey) {
  if (key === 'amountCents') return Math.abs(transaction.amountCents);
  return Date.parse(transaction.applicationDate);
}

function fallbackSortValue(transaction: Transaction) {
  return Date.parse(transaction.applicationDate);
}

function isTransactionSortKey(key: string): key is TransactionSortKey {
  return key === 'applicationDate' || key === 'amountCents';
}

function toCsv(rows: Array<Array<number | string>>) {
  return rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
}

function csvCell(value: number | string) {
  const text = String(value);
  if (!/[;"\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function timestampForFileName() {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const time = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  return `${date}-${time}`;
}

function isDuplicateError(error: unknown): error is ApiError {
  const code = error instanceof ApiError ? getErrorCode(error) : undefined;
  return code === 'FALSE_DUPLICATE' || code === 'STRONG_DUPLICATE';
}

function getErrorCode(error: ApiError) {
  return typeof error.details === 'object' && error.details && 'code' in error.details
    ? (error.details as { code?: unknown }).code
    : undefined;
}

function buildDuplicateWarning(error: ApiError): ManualDuplicateWarning {
  const code = getErrorCode(error);
  const canOverride = code === 'FALSE_DUPLICATE';

  return {
    title: canOverride ? 'Possível duplicidade' : 'Duplicidade encontrada',
    message: `${duplicateMessage(error)} ${canOverride ? 'Revise os campos ou salve mesmo assim.' : 'Altere algum campo para salvar.'}`,
    canOverride,
  };
}

function duplicateMessage(error: ApiError) {
  const duplicate =
    typeof error.details === 'object' && error.details && 'duplicate' in error.details
      ? (error.details as { duplicate?: { description?: string; amountCents?: number; applicationDate?: string } }).duplicate
      : undefined;

  if (!duplicate) {
    return 'Já existe um lançamento com o mesmo valor e data de aplicação.';
  }

  const date = duplicate.applicationDate ? formatDate(duplicate.applicationDate) : 'mesma data';
  const amount = duplicate.amountCents !== undefined ? formatCurrency(Math.abs(duplicate.amountCents)) : 'mesmo valor';
  return `Já existe "${duplicate.description ?? 'outro lançamento'}" em ${date} no valor de ${amount}.`;
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

      <div class="filter-strip transactions-filter-strip">
        <FormField label="Perfil">
          <Select v-model="profileFilter" :options="profileOptions" />
        </FormField>
        <FormField label="Tipo">
          <MultiSelect
            v-model="selectedTransactionTypeKeys"
            :options="transactionTypeOptions"
            all-label="Todos os tipos"
            empty-label="Nenhum tipo"
            search-placeholder="Filtrar tipos"
          />
        </FormField>
        <FormField label="Categoria">
          <MultiSelect
            v-model="selectedCategoryKeys"
            :options="categoryOptions"
            all-label="Todas as categorias"
            empty-label="Nenhuma categoria"
            search-placeholder="Filtrar categorias"
          />
        </FormField>
        <FormField label="Conta">
          <MultiSelect
            v-model="selectedAccountKeys"
            :options="accountOptions"
            all-label="Todas as contas"
            empty-label="Nenhuma conta"
            search-placeholder="Filtrar contas"
          />
        </FormField>
        <FormField label="Pesquisar por">
          <Select v-model="searchMode" :options="searchModeOptions" />
        </FormField>
        <div class="transaction-search-control">
          <FormField v-if="searchMode === 'description'" label="Descrição">
            <input
              v-model="descriptionFilter"
              class="form-control"
              type="search"
              autocomplete="off"
              placeholder="Pesquisar descrição"
            />
          </FormField>
          <FormField v-else-if="searchMode === 'amount'" label="Valor">
            <CurrencyInput v-model="amountFilterCents" />
          </FormField>
          <div v-else class="application-date-range">
            <FormField label="Data inicial">
              <DateInput v-model="applicationDateFromFilter" />
            </FormField>
            <FormField label="Data final">
              <DateInput v-model="applicationDateToFilter" />
            </FormField>
          </div>
          <button
            class="icon-btn transaction-search-clear"
            type="button"
            :disabled="!hasActiveSearch"
            title="Limpar pesquisa"
            aria-label="Limpar pesquisa"
            @click="clearActiveSearch"
          >
            <IconGlyph name="close" :size="15" />
          </button>
          <button
            class="icon-btn transaction-search-export"
            type="button"
            :disabled="sortedItems.length === 0"
            title="Exportar CSV"
            aria-label="Exportar lançamentos filtrados em CSV"
            @click="exportFilteredTransactionsCsv"
          >
            <IconGlyph name="download" :size="15" />
          </button>
        </div>
        <div v-if="isFutureMonth" class="filter-badge">
          <FutureBadge />
        </div>
      </div>

      <div class="transaction-total-strip" aria-live="polite">
        <div class="transaction-total-item">
          <span>Entradas em tela</span>
          <strong class="income">{{ formatCurrency(filteredTotals.incomeCents) }}</strong>
        </div>
        <div class="transaction-total-item">
          <span>Saídas em tela</span>
          <strong class="expense">{{ formatCurrency(filteredTotals.expenseCents) }}</strong>
        </div>
        <div class="transaction-total-item balance">
          <span>Saldo em tela</span>
          <strong :class="netTotalClass">
            {{ filteredTotals.netCents < 0 ? '-' : '+' }}{{ formatCurrency(Math.abs(filteredTotals.netCents)) }}
          </strong>
        </div>
      </div>

      <div v-if="error && !modalOpen" class="state-banner error" role="alert">
        {{ error }}
      </div>
      <div v-else-if="isLoading" class="state-banner">
        Carregando lançamentos...
      </div>

      <DataTable
        :columns="columns"
        :items="sortedItems"
        :sort-key="sortKey"
        :sort-direction="sortDirection"
        empty-label="Nenhum lançamento na referência selecionada"
        @sort-change="setSort"
      >
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
          {{ categoryLabel(item) }}
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
        :duplicate-warning="duplicateWarning"
        :loading="isLoading"
        @cancel="modalOpen = false"
        @change="clearDuplicateWarning"
        @confirm-duplicate="saveDuplicateOverride"
        @submit="save"
      />
    </Modal>
  </AppShell>
</template>
