<script setup lang="ts">
import { useToast } from '@/composables/useToast';

const { dismiss, messages } = useToast();
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack" aria-live="polite" aria-label="Notificações">
      <button
        v-for="message in messages"
        :key="message.id"
        type="button"
        class="toast-message"
        :class="message.kind"
        @click="dismiss(message.id)"
      >
        {{ message.message }}
      </button>
    </div>
  </Teleport>
</template>
