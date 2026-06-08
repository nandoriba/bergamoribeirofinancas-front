<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import CurrencyInput from '@/components/common/CurrencyInput.vue';
import DateInput from '@/components/common/DateInput.vue';
import FormField from '@/components/common/FormField.vue';
import Select from '@/components/common/Select.vue';
import type { InstallmentPayload } from '@/services/installments';
import type { Account, Category, InstallmentPlan, Invoice } from '@/types/api';
import { formatCurrency } from '@/utils/format';

const props = defineProps<{
  initial?: InstallmentPlan | null;
  accounts: Account[];
  categories: Category[];
  invoices: Invoice[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  submit: [payload: InstallmentPayload];
}>();

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
  { label: 'Criar ou localizar por mês', value: '' },
  ...props.invoices
    .filter((invoice) => invoice.accountId === form.accountId)
    .map((invoice) => ({ label: formatMonth(invoice.referenceMonth), value: invoice.id })),
]);

const form = reactive({
  description: props.initial?.description ?? '',
  totalInstallments: props.initial?.totalInstallments ?? 1,
  firstInstallmentNumber: props.initial?.firstInstallmentNumber ?? 1,
  monthlyAmountCents: props.initial?.monthlyAmountCents ?? 0,
  startsAt: toDateValue(props.initial?.startsAt) ?? toToday(),
  firstApplicationDate: firstApplicationDate(props.initial) ?? toToday(),
  firstReferenceMonth: toMonthValue(props.initial?.firstReferenceMonth) ?? toCurrentMonth(),
  accountId: '',
  categoryId: '',
  invoiceId: '',
});

const totalAmountCents = computed(() => form.monthlyAmountCents * Number(form.totalInstallments || 0));

watch(
  () => form.accountId,
  () => {
    if (!isCreditCard.value) form.invoiceId = '';
  },
);

function submit() {
  emit('submit', {
    description: form.description.trim(),
    totalInstallments: Number(form.totalInstallments),
    firstInstallmentNumber: Number(form.firstInstallmentNumber),
    monthlyAmountCents: Math.abs(form.monthlyAmountCents),
    totalAmountCents: totalAmountCents.value,
    startsAt: form.startsAt || toToday(),
    firstApplicationDate: form.firstApplicationDate,
    firstReferenceMonth: `${form.firstReferenceMonth}-01`,
    accountId: form.accountId || undefined,
    categoryId: form.categoryId || undefined,
    invoiceId: isCreditCard.value && form.invoiceId ? form.invoiceId : undefined,
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

function firstApplicationDate(plan?: InstallmentPlan | null) {
  const firstTransaction = plan?.transactions?.find(
    (transaction) => transaction.installmentNumber === plan.firstInstallmentNumber,
  );
  return toDateValue(firstTransaction?.applicationDate) ?? toDateValue(plan?.startsAt);
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
    <FormField label="Descrição base" class="full" required>
      <input v-model="form.description" class="form-control" required maxlength="140" />
    </FormField>

    <FormField label="Valor da parcela" required>
      <CurrencyInput v-model="form.monthlyAmountCents" />
    </FormField>

    <FormField label="Total calculado">
      <input class="form-control num" :value="formatCurrency(totalAmountCents)" readonly />
    </FormField>

    <FormField label="Total de parcelas" required>
      <input v-model.number="form.totalInstallments" class="form-control num" type="number" min="1" required />
    </FormField>

    <FormField label="Parcela atual" required>
      <input
        v-model.number="form.firstInstallmentNumber"
        class="form-control num"
        type="number"
        min="1"
        :max="form.totalInstallments"
        required
      />
    </FormField>

    <FormField label="Mês da parcela atual" required>
      <DateInput v-model="form.firstReferenceMonth" type="month" />
    </FormField>

    <FormField label="Data da parcela atual" required>
      <DateInput v-model="form.firstApplicationDate" />
    </FormField>

    <FormField label="Conta">
      <Select v-model="form.accountId" :options="accountOptions" />
    </FormField>

    <FormField label="Categoria">
      <Select v-model="form.categoryId" :options="categoryOptions" />
    </FormField>

    <FormField v-if="isCreditCard" label="Fatura inicial" class="full">
      <Select v-model="form.invoiceId" :options="invoiceOptions" />
    </FormField>

    <div class="form-actions full">
      <button class="quiet-btn" type="button" @click="emit('cancel')">
        Cancelar
      </button>
      <button class="primary-btn" type="submit" :disabled="loading || !form.description.trim()">
        Salvar parcelamento
      </button>
    </div>
  </form>
</template>
