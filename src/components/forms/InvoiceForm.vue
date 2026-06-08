<script setup lang="ts">
import { computed, reactive } from 'vue';

import DateInput from '@/components/common/DateInput.vue';
import FormField from '@/components/common/FormField.vue';
import Select from '@/components/common/Select.vue';
import type { InvoicePayload } from '@/services/invoices';
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS, type Account, type Invoice, type InvoiceStatus } from '@/types/api';

const props = defineProps<{
  initial?: Invoice | null;
  accounts: Account[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  submit: [payload: InvoicePayload];
}>();

const accountOptions = computed(() =>
  props.accounts.map((account) => ({
    label: `${account.name}${account.lastFourDigits ? ` · ${account.lastFourDigits}` : ''}`,
    value: account.id,
  })),
);

const statusOptions = INVOICE_STATUSES.map((status) => ({
  label: INVOICE_STATUS_LABELS[status],
  value: status,
}));

const isEdit = computed(() => Boolean(props.initial));

const form = reactive({
  accountId: props.initial?.accountId ?? accountOptions.value[0]?.value ?? '',
  referenceMonth: toMonthValue(props.initial?.referenceMonth) ?? toCurrentMonth(),
  dueDate: toDateValue(props.initial?.dueDate) ?? '',
  closingDate: toDateValue(props.initial?.closingDate) ?? '',
  status: (props.initial?.status ?? 'open') as InvoiceStatus,
});

const selectedAccount = computed(() => props.accounts.find((account) => account.id === form.accountId));
const closingPreview = computed(() => formatDerivedDate(form.referenceMonth, selectedAccount.value?.closingDay));
const duePreview = computed(() => formatDerivedDate(form.referenceMonth, selectedAccount.value?.dueDay));

function submit() {
  const payload: InvoicePayload = {
    accountId: form.accountId,
    referenceMonth: `${form.referenceMonth}-01`,
  };

  if (isEdit.value) {
    payload.dueDate = form.dueDate || undefined;
    payload.closingDate = form.closingDate || undefined;
    payload.status = form.status;
  }

  emit('submit', payload);
}

function toCurrentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function toMonthValue(value?: string | null) {
  if (!value) return null;
  return value.slice(0, 7);
}

function toDateValue(value?: string | null) {
  if (!value) return null;
  return value.slice(0, 10);
}

function formatDerivedDate(monthValue: string, day?: number | null) {
  if (!day) return 'Não definido';
  const [year, month] = monthValue.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), daysInMonth);
  return `${String(safeDay).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}
</script>

<template>
  <form class="form-grid" @submit.prevent="submit">
    <FormField label="Cartão" class="full">
      <Select v-model="form.accountId" :options="accountOptions" placeholder="Selecione um cartão" />
    </FormField>

    <FormField label="Mês de referência">
      <DateInput v-model="form.referenceMonth" type="month" />
    </FormField>

    <div v-if="!isEdit" class="invoice-preview full">
      <div>
        <span>Fechamento previsto</span>
        <strong>{{ closingPreview }}</strong>
      </div>
      <div>
        <span>Vencimento previsto</span>
        <strong>{{ duePreview }}</strong>
      </div>
    </div>

    <FormField v-if="isEdit" label="Status">
      <Select v-model="form.status" :options="statusOptions" />
    </FormField>

    <FormField v-if="isEdit" label="Fechamento">
      <DateInput v-model="form.closingDate" />
    </FormField>

    <FormField v-if="isEdit" label="Vencimento">
      <DateInput v-model="form.dueDate" />
    </FormField>

    <div class="form-actions full">
      <button class="quiet-btn" type="button" @click="emit('cancel')">
        Cancelar
      </button>
      <button class="primary-btn" type="submit" :disabled="loading || !form.accountId">
        Salvar
      </button>
    </div>
  </form>
</template>
