<script setup lang="ts">
import IconGlyph from '@/components/common/IconGlyph.vue';

defineProps<{
  label: string;
}>();

defineEmits<{
  previous: [];
  next: [];
}>();
</script>

<template>
  <div class="month-nav" aria-label="Selecionar mês">
    <button type="button" aria-label="Mês anterior" @click="$emit('previous')">
      <IconGlyph name="chevL" :size="14" />
    </button>
    <div class="month-pill" aria-live="polite">
      <span class="dot" />
      <span>{{ label }}</span>
    </div>
    <button type="button" aria-label="Próximo mês" @click="$emit('next')">
      <IconGlyph name="chevR" :size="14" />
    </button>
  </div>
</template>

