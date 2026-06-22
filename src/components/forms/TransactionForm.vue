<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import CurrencyInput from '@/components/common/CurrencyInput.vue';
import DateInput from '@/components/common/DateInput.vue';
import FormField from '@/components/common/FormField.vue';
import Select from '@/components/common/Select.vue';
import type { TransactionPayload } from '@/services/transactions';
import {
  TRANSACTION_STATUSES,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
  type Account,
  type Category,
  type Invoice,
  type Transaction,
  type TransactionStatus,
  type TransactionType,
} from '@/types/api';

const props = defineProps<{
  initial?: Transaction | null;
  accounts: Account[];
  categories: Category[];
  invoices: Invoice[];
  duplicateWarning?: {
    title: string;
    message: string;
    canOverride: boolean;
  } | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  change: [];
  confirmDuplicate: [];
  submit: [payload: TransactionPayload];
}>();

const typeOptions = TRANSACTION_TYPES.map((type) => ({ label: TRANSACTION_TYPE_LABELS[type], value: type }));
const statusOptions = TRANSACTION_STATUSES.map((status) => ({ label: TRANSACTION_STATUS_LABELS[status], value: status }));

const accountOptions = computed(() => [
  { label: 'Sem conta', value: '' },
  ...props.accounts.map((account) => ({
    label: `${account.name}${account.lastFourDigits ? ` · ${account.lastFourDigits}` : ''}`,
    value: account.id,
  })),
]);

const categoryOptions = computed(() => [
  { label: 'Sem categoria', value: '' },
  ...props.categories.map((category) => ({ label: category.name, value: category.id })),
]);

const selectedAccount = computed(() => props.accounts.find((account) => account.id === form.accountId));
const isCreditCard = computed(() => selectedAccount.value?.type === 'credit_card');
const invoiceOptions = computed(() => [
  { label: 'Sem fatura', value: '' },
  ...props.invoices
    .filter((invoice) => invoice.accountId === form.accountId)
    .map((invoice) => ({
      label: `${formatMonth(invoice.referenceMonth)} · ${INVOICE_STATUS_LABELS[invoice.status]}`,
      value: invoice.id,
    })),
]);

const form = reactive({
  applicationDate: toDateValue(props.initial?.applicationDate) ?? toToday(),
  referenceMonth:
    toMonthValue(props.initial?.referenceMonth) ?? toMonthValue(props.initial?.applicationDate) ?? toCurrentMonth(),
  description: props.initial?.description ?? '',
  amountCents: Math.abs(props.initial?.amountCents ?? 0),
  type: (props.initial?.type ?? 'expense') as TransactionType,
  status: (props.initial?.status ?? 'confirmed') as TransactionStatus,
  accountId: props.initial?.accountId ?? '',
  categoryId: props.initial?.categoryId ?? '',
  invoiceId: props.initial?.invoiceId ?? '',
  notes: props.initial?.notes ?? '',
});

const isFutureApplicationDate = computed(() => form.applicationDate > toToday());

watch(
  () => form.applicationDate,
  () => {
    if (!isFutureApplicationDate.value) {
      form.status = 'confirmed';
    }
  },
  { immediate: true },
);

watch(
  () => form.accountId,
  () => {
    if (!isCreditCard.value) {
      form.invoiceId = '';
    }
  },
);

watch(
  form,
  () => {
    emit('change');
  },
  { deep: true },
);

function submit() {
  if (props.duplicateWarning) return;
  emit('submit', {
    applicationDate: form.applicationDate,
    referenceMonth: `${form.referenceMonth}-01`,
    description: form.description.trim(),
    amountCents: Math.abs(form.amountCents),
    type: form.type,
    status: isFutureApplicationDate.value ? form.status : 'confirmed',
    recurrenceType: 'none',
    accountId: form.accountId || undefined,
    categoryId: form.categoryId || undefined,
    invoiceId: isCreditCard.value && form.invoiceId ? form.invoiceId : undefined,
    notes: form.notes.trim() || undefined,
  });
}

function toToday() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function toCurrentMonth() {
  return toToday().slice(0, 7);
}

function toDateValue(value?: string | null) {
  if (!value) return null;
  return value.slice(0, 10);
}

function toMonthValue(value?: string | null) {
  if (!value) return null;
  return value.slice(0, 7);
}

function formatMonth(value: string) {
  const [year, month] = value.slice(0, 7).split('-');
  return `${month}/${year}`;
}
</script>

<template>
  <form class="form-grid" @submit.prevent="submit">
    <FormField label="Mês de referência" required>
      <DateInput v-model="form.referenceMonth" type="month" />
    </FormField>

    <FormField label="Data de aplicação" required>
      <DateInput v-model="form.applicationDate" />
    </FormField>

    <FormField label="Descrição" class="full" required>
      <input v-model="form.description" class="form-control" required maxlength="200" />
    </FormField>

    <FormField label="Valor" required>
      <CurrencyInput v-model="form.amountCents" />
    </FormField>

    <FormField label="Tipo" required>
      <Select v-model="form.type" :options="typeOptions" />
    </FormField>

    <FormField v-if="isFutureApplicationDate" label="Status" required>
      <Select v-model="form.status" :options="statusOptions" />
    </FormField>

    <FormField label="Conta">
      <Select v-model="form.accountId" :options="accountOptions" />
    </FormField>

    <FormField label="Categoria">
      <Select v-model="form.categoryId" :options="categoryOptions" />
    </FormField>

    <FormField v-if="isCreditCard" label="Fatura" class="full">
      <Select v-model="form.invoiceId" :options="invoiceOptions" />
    </FormField>

    <FormField label="Notas" class="full">
      <textarea v-model="form.notes" class="form-control" maxlength="500" />
    </FormField>

    <div v-if="duplicateWarning" class="duplicate-alert full" role="alert" aria-live="polite">
      <strong>{{ duplicateWarning.title }}</strong>
      <span>{{ duplicateWarning.message }}</span>
    </div>

    <div class="form-actions full">
      <button class="quiet-btn" type="button" @click="emit('cancel')">
        Cancelar
      </button>
      <button
        v-if="duplicateWarning?.canOverride"
        class="primary-btn"
        type="button"
        :disabled="loading"
        @click="emit('confirmDuplicate')"
      >
        Salvar mesmo assim
      </button>
      <button v-else class="primary-btn" type="submit" :disabled="loading || !form.description.trim() || !!duplicateWarning">
        Salvar lançamento
      </button>
    </div>
  </form>
</template>
