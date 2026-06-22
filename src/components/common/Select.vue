<script setup lang="ts">
defineProps<{
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
  <select v-model="model" class="form-control">
    <option v-if="placeholder" value="">
      {{ placeholder }}
    </option>
    <option v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>
