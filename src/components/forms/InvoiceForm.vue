<script setup lang="ts">
import { computed, reactive } from 'vue';

import CurrencyInput from '@/components/common/CurrencyInput.vue';
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

const form = reactive({
  accountId: props.initial?.accountId ?? accountOptions.value[0]?.value ?? '',
  referenceMonth: toMonthValue(props.initial?.referenceMonth) ?? toCurrentMonth(),
  dueDate: toDateValue(props.initial?.dueDate) ?? '',
  closingDate: toDateValue(props.initial?.closingDate) ?? '',
  totalCents: props.initial?.totalCents ?? 0,
  status: (props.initial?.status ?? 'open') as InvoiceStatus,
});

function submit() {
  emit('submit', {
    accountId: form.accountId,
    referenceMonth: `${form.referenceMonth}-01`,
    dueDate: form.dueDate || undefined,
    closingDate: form.closingDate || undefined,
    totalCents: form.totalCents,
    status: form.status,
  });
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
</script>

<template>
  <form class="form-grid" @submit.prevent="submit">
    <FormField label="Cartão" class="full">
      <Select v-model="form.accountId" :options="accountOptions" placeholder="Selecione um cartão" />
    </FormField>

    <FormField label="Mês de referência">
      <DateInput v-model="form.referenceMonth" type="month" />
    </FormField>

    <FormField label="Status">
      <Select v-model="form.status" :options="statusOptions" />
    </FormField>

    <FormField label="Fechamento">
      <DateInput v-model="form.closingDate" />
    </FormField>

    <FormField label="Vencimento">
      <DateInput v-model="form.dueDate" />
    </FormField>

    <FormField label="Valor fechado" class="full">
      <CurrencyInput v-model="form.totalCents" />
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
