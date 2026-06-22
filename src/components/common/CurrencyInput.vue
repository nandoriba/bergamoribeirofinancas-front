<script setup lang="ts">
import { computed } from 'vue';

import { formatBRL, parseCurrencyInputCents } from '@/utils/format';

const model = defineModel<number>({ required: true });

const value = computed(() => formatBRL(model.value));

function handleInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const cents = parseCurrencyInputCents(input.value);
  model.value = cents;
  input.value = formatBRL(cents);
}
</script>

<template>
  <input
    :value="value"
    class="form-control num"
    inputmode="numeric"
    autocomplete="off"
    @input="handleInput"
  />
</template>
