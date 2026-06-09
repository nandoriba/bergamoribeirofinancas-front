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
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  TRANSACTION_STATUS_LABELS,
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
const selectedCategoryKeys = ref<string[]>([]);
const selectedAccountTypeKeys = ref<string[]>([]);
const descriptionFilter = ref('');
const applicationDateFilter = ref('');
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
  { key: 'applicationDate', label: 'Aplicação', sortable: true },
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
  { label: 'Aplicação', value: 'applicationDate' },
];

const SPECIAL_OPERATIONAL_CATEGORY_KEYS = new Set(['system:invoice_adjustment', 'system:invoice_payment']);
const UNCATEGORIZED_CATEGORY_KEY = 'system:uncategorized';
const NO_ACCOUNT_TYPE_KEY = 'system:no_account';

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

const accountTypeOptions = computed(() => {
  const hasNoAccount = items.value.some((transaction) => accountTypeKey(transaction) === NO_ACCOUNT_TYPE_KEY);
  return [
    ...ACCOUNT_TYPES.map((value) => ({ label: ACCOUNT_TYPE_LABELS[value], value: `account:${value}` })),
    ...(hasNoAccount ? [{ label: 'Sem conta', value: NO_ACCOUNT_TYPE_KEY }] : []),
  ];
});

const normalizedDescriptionFilter = computed(() => normalizeSearch(descriptionFilter.value));
const categoryOptionValues = computed(() => categoryOptions.value.map((option) => option.value));
const accountTypeOptionValues = computed(() => accountTypeOptions.value.map((option) => option.value));
const hasActiveSearch = computed(() => {
  if (searchMode.value === 'amount') return amountFilterCents.value !== 0;
  if (searchMode.value === 'applicationDate') return Boolean(applicationDateFilter.value);
  return Boolean(normalizedDescriptionFilter.value);
});

const filteredItems = computed(() =>
  items.value.filter((transaction) => {
    const profileMatch = !profileFilter.value || transaction.memberProfileId === profileFilter.value;
    const categoryMatch = selectedCategoryKeys.value.includes(categoryKey(transaction));
    const accountTypeMatch = selectedAccountTypeKeys.value.includes(accountTypeKey(transaction));
    return profileMatch && categoryMatch && accountTypeMatch && matchesActiveSearch(transaction);
  }),
);
const sortedItems = computed(() => [...filteredItems.value].sort(compareTransactions));

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
  accountTypeOptionValues,
  (nextValues, previousValues = []) => {
    syncSelectedOptionValues(selectedAccountTypeKeys, nextValues, previousValues);
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
  applicationDateFilter.value = '';
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
    return !applicationDateFilter.value || transaction.applicationDate.slice(0, 10) === applicationDateFilter.value;
  }

  return !normalizedDescriptionFilter.value || normalizeSearch(transaction.description).includes(normalizedDescriptionFilter.value);
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

function accountTypeKey(transaction: Transaction) {
  return transaction.account?.type ? `account:${transaction.account.type}` : NO_ACCOUNT_TYPE_KEY;
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
        <FormField label="Categoria">
          <MultiSelect
            v-model="selectedCategoryKeys"
            :options="categoryOptions"
            all-label="Todas as categorias"
            empty-label="Nenhuma categoria"
            search-placeholder="Filtrar categorias"
          />
        </FormField>
        <FormField label="Tipo de conta">
          <MultiSelect
            v-model="selectedAccountTypeKeys"
            :options="accountTypeOptions"
            all-label="Todos os tipos"
            empty-label="Nenhum tipo"
            search-placeholder="Filtrar tipos"
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
          <FormField v-else label="Data de aplicação">
            <DateInput v-model="applicationDateFilter" />
          </FormField>
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
        </div>
        <div v-if="isFutureMonth" class="filter-badge">
          <FutureBadge />
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
