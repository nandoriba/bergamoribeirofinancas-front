<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';

import IconGlyph from '@/components/common/IconGlyph.vue';
import ThemeToggle from '@/components/layout/ThemeToggle.vue';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const email = ref('');
const password = ref('');
const localError = ref<string | null>(null);

const canSubmit = computed(() => email.value.trim().length > 0 && password.value.length >= 1 && !authStore.isLoading);

async function submit() {
  if (!canSubmit.value) return;
  localError.value = null;
  try {
    await authStore.login(email.value, password.value);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.replace(redirect);
  } catch (err) {
    localError.value = err instanceof Error ? err.message : 'Falha ao entrar';
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-panel" aria-label="Entrar no sistema financeiro">
      <div class="login-brand">
        <div class="brand-mark">
          R
        </div>
        <div>
          <p class="eyebrow">
            Casa Ribeiro
          </p>
          <h1>Finanças</h1>
        </div>
        <ThemeToggle />
      </div>

      <form class="login-form" @submit.prevent="submit">
        <label>
          <span>Email</span>
          <input v-model.trim="email" autocomplete="email" type="email" required>
        </label>

        <label>
          <span>Senha</span>
          <input v-model="password" autocomplete="current-password" type="password" required>
        </label>

        <p v-if="localError || authStore.error" class="form-error" role="alert">
          {{ localError || authStore.error }}
        </p>

        <button class="primary-btn login-submit" type="submit" :disabled="!canSubmit">
          <IconGlyph name="check" :size="15" />
          {{ authStore.isLoading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </section>
  </main>
</template>
