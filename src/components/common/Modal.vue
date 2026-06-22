<script setup lang="ts">
import IconGlyph from './IconGlyph.vue';

defineProps<{
  open: boolean;
  title: string;
  size?: 'lg' | 'md' | 'sm';
}>();

defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-layer" role="presentation">
      <button class="modal-backdrop" type="button" aria-label="Fechar modal" @click="$emit('close')" />
      <section class="modal-panel" :class="size ?? 'md'" role="dialog" aria-modal="true" :aria-label="title">
        <header class="modal-head">
          <h2>{{ title }}</h2>
          <button class="icon-btn" type="button" aria-label="Fechar" @click="$emit('close')">
            <IconGlyph name="close" />
          </button>
        </header>
        <div class="modal-body">
          <slot />
        </div>
      </section>
    </div>
  </Teleport>
</template>
