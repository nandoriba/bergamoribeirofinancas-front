<script setup lang="ts">
import { computed } from 'vue';

const model = defineModel<number>({ required: true });

const value = computed({
  get: () => (model.value / 100).toFixed(2).replace('.', ','),
  set: (next: string) => {
    const normalized = next.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const amount = Number.parseFloat(normalized);
    model.value = Number.isFinite(amount) ? Math.round(amount * 100) : 0;
  },
});
</script>

<template>
  <input v-model="value" class="form-control num" inputmode="decimal" autocomplete="off" />
</template>
