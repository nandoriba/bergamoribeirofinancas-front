<script setup lang="ts">
defineProps<{
  error?: string | null;
  hint?: string;
  label: string;
  required?: boolean;
}>();
</script>

<template>
  <label class="form-field">
    <span class="form-label">
      {{ label }}
      <span v-if="required" aria-hidden="true">*</span>
    </span>
    <slot />
    <span v-if="error" class="field-error" role="alert">{{ error }}</span>
    <span v-else-if="hint" class="field-hint">{{ hint }}</span>
  </label>
</template>
