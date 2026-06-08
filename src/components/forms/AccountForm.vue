<script setup lang="ts">
import { computed, reactive } from 'vue';

import CurrencyInput from '@/components/common/CurrencyInput.vue';
import FormField from '@/components/common/FormField.vue';
import SelectInput from '@/components/common/Select.vue';
import type { AccountPayload } from '@/services/accounts';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES, type Account } from '@/types/api';

const props = defineProps<{
  initial?: Account | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  submit: [payload: AccountPayload];
}>();

const form = reactive({
  name: props.initial?.name ?? '',
  type: props.initial?.type ?? 'checking',
  institution: props.initial?.institution ?? '',
  lastFourDigits: props.initial?.lastFourDigits ?? '',
  closingDay: props.initial?.closingDay ? String(props.initial.closingDay) : '',
  dueDay: props.initial?.dueDay ? String(props.initial.dueDay) : '',
  initialBalanceCents: props.initial?.initialBalanceCents ?? 0,
});

const typeOptions = ACCOUNT_TYPES.map((value) => ({ value, label: ACCOUNT_TYPE_LABELS[value] }));
const isCreditCard = computed(() => form.type === 'credit_card');

function optionalDay(value: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function submit() {
  emit('submit', {
    name: form.name.trim(),
    type: form.type,
    institution: form.institution.trim() || undefined,
    lastFourDigits: form.lastFourDigits.trim() || undefined,
    closingDay: isCreditCard.value ? optionalDay(form.closingDay) : undefined,
    dueDay: isCreditCard.value ? optionalDay(form.dueDay) : undefined,
    initialBalanceCents: form.initialBalanceCents,
  });
}
</script>

<template>
  <form class="form-grid" @submit.prevent="submit">
    <FormField label="Nome" required>
      <input v-model="form.name" class="form-control" required maxlength="80" />
    </FormField>

    <FormField label="Tipo" required>
      <SelectInput v-model="form.type" :options="typeOptions" />
    </FormField>

    <FormField label="Instituição">
      <input v-model="form.institution" class="form-control" maxlength="80" />
    </FormField>

    <FormField label="Saldo inicial">
      <CurrencyInput v-model="form.initialBalanceCents" />
    </FormField>

    <FormField v-if="isCreditCard" label="Últimos 4 dígitos">
      <input v-model="form.lastFourDigits" class="form-control num" maxlength="4" inputmode="numeric" />
    </FormField>

    <FormField v-if="isCreditCard" label="Fechamento">
      <input v-model="form.closingDay" class="form-control num" type="number" min="1" max="31" />
    </FormField>

    <FormField v-if="isCreditCard" label="Vencimento">
      <input v-model="form.dueDay" class="form-control num" type="number" min="1" max="31" />
    </FormField>

    <div class="form-actions full">
      <button class="quiet-btn" type="button" @click="$emit('cancel')">
        Cancelar
      </button>
      <button class="primary-btn" type="submit" :disabled="loading || !form.name.trim()">
        Salvar conta
      </button>
    </div>
  </form>
</template>
