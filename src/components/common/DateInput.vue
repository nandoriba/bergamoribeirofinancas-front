<script setup lang="ts">
defineProps<{
  type?: 'date' | 'month';
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
  <input v-model="model" class="form-control num" :type="type ?? 'date'" />
</template>
