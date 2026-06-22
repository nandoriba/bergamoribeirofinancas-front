<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

import DataTable from '@/components/common/DataTable.vue';
import FormField from '@/components/common/FormField.vue';
import IconGlyph from '@/components/common/IconGlyph.vue';
import AppShell from '@/components/layout/AppShell.vue';
import { useToast } from '@/composables/useToast';
import type { TelegramAuthCodeResponse } from '@/services/telegram';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { useThemeStore } from '@/stores/theme';

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const themeStore = useThemeStore();
const toast = useToast();
const { approvals, error, invites, isLoading, isTelegramLoading, telegramGroupCode, telegramMemberCode } =
  storeToRefs(settingsStore);

const inviteForm = reactive({
  email: '',
  expiresInDays: 7,
});
const lastInviteLink = ref('');
const now = ref(new Date());
let countdownTimer: number | undefined;

const isAdmin = computed(() => authStore.user?.role === 'admin');
const pendingApprovals = computed(() => approvals.value.filter((approval) => approval.status === 'pending'));

const inviteColumns = [
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'expiresAt', label: 'Expira em' },
];

const approvalColumns = [
  { key: 'requestedName', label: 'Nome' },
  { key: 'requestedEmail', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Solicitado em' },
];

onMounted(() => {
  if (isAdmin.value) {
    void settingsStore.refresh();
  }
  countdownTimer = window.setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (countdownTimer !== undefined) {
    window.clearInterval(countdownTimer);
  }
});

async function createInvite() {
  try {
    const invite = await settingsStore.createInvite({
      email: inviteForm.email.trim() || undefined,
      expiresInDays: Number(inviteForm.expiresInDays),
    });
    lastInviteLink.value = invite.link ?? '';
    inviteForm.email = '';
    toast.success('Convite criado');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao criar convite');
  }
}

async function approve(id: string) {
  try {
    await settingsStore.approve(id);
    toast.success('Membro aprovado');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao aprovar membro');
  }
}

async function reject(id: string) {
  try {
    await settingsStore.reject(id);
    toast.success('Solicitação rejeitada');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao rejeitar solicitação');
  }
}

async function createTelegramGroupCode() {
  try {
    await settingsStore.createTelegramGroupCode();
    toast.success('Código gerado');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao gerar código do grupo');
  }
}

async function createTelegramMemberCode() {
  try {
    await settingsStore.createTelegramMemberCode();
    toast.success('Código gerado');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao gerar código de vínculo');
  }
}

async function copyTelegramCommand(code: TelegramAuthCodeResponse | null) {
  if (!code) return;
  if (isExpired(code)) {
    toast.error('Código expirado. Gere um novo código.');
    return;
  }

  let copied = false;
  try {
    copied = await copyText(code.instruction);
  } catch {
    copied = false;
  }

  if (copied) {
    toast.success('Comando copiado');
    return;
  }

  toast.error('Não foi possível copiar o comando');
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function isExpired(code?: TelegramAuthCodeResponse | null) {
  if (!code) return false;
  return new Date(code.expiresAt).getTime() <= now.value.getTime();
}

function countdownLabel(code?: TelegramAuthCodeResponse | null) {
  if (!code) return '';
  const remainingMs = new Date(code.expiresAt).getTime() - now.value.getTime();
  if (remainingMs <= 0) return 'Código expirado';
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `Expira em ${minutes}:${String(seconds).padStart(2, '0')}`;
}

async function copyText(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textArea);
  }
}
</script>

<template>
  <AppShell>
    <section class="settings-grid">
      <div class="data-surface">
        <div class="section-head">
          <div>
            <h2>Preferências</h2>
            <span class="meta">sessão atual</span>
          </div>
        </div>

        <div class="settings-actions">
          <button
            class="quiet-btn"
            type="button"
            :class="{ active: themeStore.theme === 'dark' }"
            @click="themeStore.setTheme('dark')"
          >
            <IconGlyph name="moon" />
            Escuro
          </button>
          <button
            class="quiet-btn"
            type="button"
            :class="{ active: themeStore.theme === 'light' }"
            @click="themeStore.setTheme('light')"
          >
            <IconGlyph name="sun" />
            Claro
          </button>
        </div>
      </div>

      <div class="data-surface">
        <div class="section-head">
          <div>
            <h2>Convidar membro</h2>
            <span class="meta">{{ invites.length }} convites</span>
          </div>
        </div>

        <div v-if="!isAdmin" class="state-banner">
          Apenas administradores podem gerenciar convites.
        </div>

        <form v-else class="form-grid" @submit.prevent="createInvite">
          <FormField label="Email" class="full">
            <input v-model="inviteForm.email" class="form-control" type="email" placeholder="email@exemplo.com" />
          </FormField>
          <FormField label="Validade em dias">
            <input v-model.number="inviteForm.expiresInDays" class="form-control num" type="number" min="1" max="30" />
          </FormField>
          <div class="form-actions">
            <button class="primary-btn" type="submit" :disabled="isLoading">
              <IconGlyph name="plus" />
              Criar convite
            </button>
          </div>
          <div v-if="lastInviteLink" class="invite-link full">
            {{ lastInviteLink }}
          </div>
        </form>
      </div>

      <div class="data-surface settings-wide telegram-surface">
        <div class="section-head">
          <div>
            <h2>Telegram</h2>
            <span class="meta">bot financeiro</span>
          </div>
        </div>

        <div class="telegram-grid">
          <article class="telegram-card" :class="{ locked: !isAdmin }">
            <div class="telegram-card-head">
              <div>
                <strong>Autorizar grupo</strong>
                <span>Gere o comando que libera o grupo para usar o bot.</span>
              </div>
              <button
                v-if="isAdmin"
                class="primary-btn"
                type="button"
                :disabled="isTelegramLoading"
                @click="createTelegramGroupCode"
              >
                <IconGlyph name="send" />
                Gerar código
              </button>
            </div>

            <div v-if="!isAdmin" class="state-banner">
              Somente administradores podem autorizar grupos.
            </div>
            <div v-else-if="telegramGroupCode" class="telegram-command" :class="{ expired: isExpired(telegramGroupCode) }">
              <div class="telegram-command-meta">
                <span>{{ countdownLabel(telegramGroupCode) }}</span>
                <span>Validade: {{ formatDateTime(telegramGroupCode.expiresAt) }}</span>
              </div>
              <code>{{ telegramGroupCode.instruction }}</code>
              <button
                class="quiet-btn"
                type="button"
                :disabled="isExpired(telegramGroupCode)"
                @click="copyTelegramCommand(telegramGroupCode)"
              >
                <IconGlyph name="copy" />
                Copiar comando
              </button>
            </div>
          </article>

          <article class="telegram-card">
            <div class="telegram-card-head">
              <div>
                <strong>Vincular meu usuário</strong>
                <span>Gere o comando para associar seu Telegram ao seu perfil.</span>
              </div>
              <button
                class="primary-btn"
                type="button"
                :disabled="isTelegramLoading"
                @click="createTelegramMemberCode"
              >
                <IconGlyph name="send" />
                Gerar vínculo
              </button>
            </div>

            <div v-if="telegramMemberCode" class="telegram-command" :class="{ expired: isExpired(telegramMemberCode) }">
              <div class="telegram-command-meta">
                <span>{{ countdownLabel(telegramMemberCode) }}</span>
                <span>Validade: {{ formatDateTime(telegramMemberCode.expiresAt) }}</span>
              </div>
              <code>{{ telegramMemberCode.instruction }}</code>
              <button
                class="quiet-btn"
                type="button"
                :disabled="isExpired(telegramMemberCode)"
                @click="copyTelegramCommand(telegramMemberCode)"
              >
                <IconGlyph name="copy" />
                Copiar comando
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section v-if="isAdmin" class="data-surface">
      <div class="section-head">
        <div>
          <h2>Aprovações pendentes</h2>
          <span class="meta">{{ pendingApprovals.length }} pendentes</span>
        </div>
      </div>

      <div v-if="error" class="state-banner error" role="alert">
        {{ error }}
      </div>
      <div v-else-if="isLoading" class="state-banner">
        Carregando configurações...
      </div>

      <DataTable :columns="approvalColumns" :items="approvals" empty-label="Nenhuma solicitação encontrada">
        <template #cell-createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
        <template #cell-status="{ item }">
          <span class="status-badge" :class="item.status">{{ item.status }}</span>
        </template>
        <template #actions="{ item }">
          <div v-if="item.status === 'pending'" class="row-actions">
            <button class="quiet-btn" type="button" @click="approve(item.id)">
              Aprovar
            </button>
            <button class="quiet-btn" type="button" @click="reject(item.id)">
              Rejeitar
            </button>
          </div>
        </template>
      </DataTable>
    </section>

    <section v-if="isAdmin" class="data-surface">
      <div class="section-head">
        <div>
          <h2>Convites</h2>
          <span class="meta">{{ invites.length }} registros</span>
        </div>
      </div>

      <DataTable :columns="inviteColumns" :items="invites" empty-label="Nenhum convite criado">
        <template #cell-email="{ item }">
          {{ item.email ?? 'Link aberto' }}
        </template>
        <template #cell-status="{ item }">
          <span class="status-badge" :class="item.status">{{ item.status }}</span>
        </template>
        <template #cell-expiresAt="{ item }">
          {{ formatDate(item.expiresAt) }}
        </template>
      </DataTable>
    </section>
  </AppShell>
</template>
