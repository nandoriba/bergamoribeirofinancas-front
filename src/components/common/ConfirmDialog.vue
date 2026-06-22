<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm';

const { answer, request } = useConfirm();
</script>

<template>
  <Teleport to="body">
    <div v-if="request" class="modal-layer" role="presentation">
      <button class="modal-backdrop" type="button" aria-label="Cancelar" @click="answer(false)" />
      <section class="confirm-panel" role="alertdialog" aria-modal="true" :aria-label="request.title">
        <h2>{{ request.title }}</h2>
        <p>{{ request.message }}</p>
        <div class="form-actions">
          <button class="quiet-btn" type="button" @click="answer(false)">
            {{ request.cancelLabel }}
          </button>
          <button
            class="primary-btn"
            :class="{ danger: request.destructive }"
            type="button"
            @click="answer(true)"
          >
            {{ request.confirmLabel }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
