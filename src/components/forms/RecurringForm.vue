<script setup lang="ts">
import { computed, reactive } from 'vue';

import CurrencyInput from '@/components/common/CurrencyInput.vue';
import DateInput from '@/components/common/DateInput.vue';
import FormField from '@/components/common/FormField.vue';
import Select from '@/components/common/Select.vue';
import type { RecurringPayload } from '@/services/recurring';
import {
  RECURRING_STATUSES,
  RECURRING_STATUS_LABELS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  type Account,
  type Category,
  type RecurringStatus,
  type RecurringTemplate,
  type TransactionType,
} from '@/types/api';

const props = defineProps<{
  initial?: RecurringTemplate | null;
  accounts: Account[];
  categories: Category[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  submit: [payload: RecurringPayload];
}>();

const typeOptions = TRANSACTION_TYPES.map((type) => ({ label: TRANSACTION_TYPE_LABELS[type], value: type }));
const statusOptions = RECURRING_STATUSES.map((status) => ({ label: RECURRING_STATUS_LABELS[status], value: status }));

const accountOptions = computed(() => [
  { label: 'Sem conta', value: '' },
  ...props.accounts.map((account) => ({ label: account.name, value: account.id })),
]);

const categoryOptions = computed(() => [
  { label: 'Sem categoria', value: '' },
  ...props.categories.map((category) => ({ label: category.name, value: category.id })),
]);

const form = reactive({
  description: props.initial?.description ?? '',
  amountCents: Math.abs(props.initial?.amountCents ?? 0),
  type: (props.initial?.type ?? 'expense') as TransactionType,
  dayOfMonth: props.initial?.dayOfMonth ?? 1,
  startsAt: toDateValue(props.initial?.startsAt) ?? toToday(),
  endsAt: toDateValue(props.initial?.endsAt) ?? '',
  notes: props.initial?.notes ?? '',
  status: (props.initial?.status ?? 'active') as RecurringStatus,
  accountId: props.initial?.accountId ?? '',
  categoryId: props.initial?.categoryId ?? '',
});

function submit() {
  emit('submit', {
    description: form.description.trim(),
    amountCents: Math.abs(form.amountCents),
    type: form.type,
    dayOfMonth: Number(form.dayOfMonth),
    startsAt: form.startsAt,
    endsAt: form.endsAt || undefined,
    notes: form.notes.trim() || undefined,
    status: form.status,
    accountId: form.accountId || undefined,
    categoryId: form.categoryId || undefined,
  });
}

function toToday() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function toDateValue(value?: string | null) {
  if (!value) return null;
  return value.slice(0, 10);
}
</script>

<template>
  <form class="form-grid" @submit.prevent="submit">
    <FormField label="Descrição" class="full" required>
      <input v-model="form.description" class="form-control" required maxlength="140" />
    </FormField>

    <FormField label="Valor" required>
      <CurrencyInput v-model="form.amountCents" />
    </FormField>

    <FormField label="Tipo" required>
      <Select v-model="form.type" :options="typeOptions" />
    </FormField>

    <FormField label="Dia do mês" required>
      <input v-model.number="form.dayOfMonth" class="form-control num" type="number" min="1" max="31" required />
    </FormField>

    <FormField label="Status" required>
      <Select v-model="form.status" :options="statusOptions" />
    </FormField>

    <FormField label="Início" required>
      <DateInput v-model="form.startsAt" />
    </FormField>

    <FormField label="Fim">
      <DateInput v-model="form.endsAt" />
    </FormField>

    <FormField label="Conta">
      <Select v-model="form.accountId" :options="accountOptions" />
    </FormField>

    <FormField label="Categoria">
      <Select v-model="form.categoryId" :options="categoryOptions" />
    </FormField>

    <FormField label="Observação" class="full">
      <textarea v-model="form.notes" class="form-control" maxlength="500" />
    </FormField>

    <div class="form-actions full">
      <button class="quiet-btn" type="button" @click="emit('cancel')">
        Cancelar
      </button>
      <button class="primary-btn" type="submit" :disabled="loading || !form.description.trim()">
        Salvar recorrente
      </button>
    </div>
  </form>
</template>
