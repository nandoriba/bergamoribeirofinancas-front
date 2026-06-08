<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, reactive, ref } from 'vue';

import DataTable from '@/components/common/DataTable.vue';
import FormField from '@/components/common/FormField.vue';
import IconGlyph from '@/components/common/IconGlyph.vue';
import AppShell from '@/components/layout/AppShell.vue';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { useThemeStore } from '@/stores/theme';

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const themeStore = useThemeStore();
const toast = useToast();
const { approvals, error, invites, isLoading } = storeToRefs(settingsStore);

const inviteForm = reactive({
  email: '',
  expiresInDays: 7,
});
const lastInviteLink = ref('');

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

function formatDate(value?: string | null) {
  if (!value) return '-';
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
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
