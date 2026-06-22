<script setup lang="ts">
import { reactive } from 'vue';

import FormField from '@/components/common/FormField.vue';
import SelectInput from '@/components/common/Select.vue';
import type { CategoryPayload } from '@/services/categories';
import { CATEGORY_TYPE_LABELS, CATEGORY_TYPES, type Category } from '@/types/api';

const props = defineProps<{
  initial?: Category | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  submit: [payload: CategoryPayload];
}>();

const form = reactive({
  name: props.initial?.name ?? '',
  type: props.initial?.type ?? 'expense',
  color: props.initial?.color ?? '#5283c8',
  aliases: props.initial?.aliases.join(', ') ?? '',
});

const typeOptions = CATEGORY_TYPES.map((value) => ({ value, label: CATEGORY_TYPE_LABELS[value] }));

function submit() {
  emit('submit', {
    name: form.name.trim(),
    type: form.type,
    color: form.color,
    aliases: form.aliases
      .split(',')
      .map((alias) => alias.trim())
      .filter(Boolean),
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

    <FormField label="Cor" required>
      <input v-model="form.color" class="form-control color-control" type="color" required />
    </FormField>

    <FormField class="full" label="Aliases" hint="Separe por vírgula para ajudar a sugestão na importação">
      <input v-model="form.aliases" class="form-control" placeholder="mercado, supermercado, compras" />
    </FormField>

    <div class="form-actions full">
      <button class="quiet-btn" type="button" @click="$emit('cancel')">
        Cancelar
      </button>
      <button class="primary-btn" type="submit" :disabled="loading || !form.name.trim()">
        Salvar categoria
      </button>
    </div>
  </form>
</template>
