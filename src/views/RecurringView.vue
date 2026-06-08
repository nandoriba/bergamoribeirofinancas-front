<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

import DataTable from '@/components/common/DataTable.vue';
import IconGlyph from '@/components/common/IconGlyph.vue';
import Modal from '@/components/common/Modal.vue';
import RecurringForm from '@/components/forms/RecurringForm.vue';
import AppShell from '@/components/layout/AppShell.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import { useAccountsStore } from '@/stores/accounts';
import { useAuthStore } from '@/stores/auth';
import { useCategoriesStore } from '@/stores/categories';
import { useDashboardStore } from '@/stores/dashboard';
import { useRecurringStore } from '@/stores/recurring';
import { RECURRING_STATUS_LABELS, TRANSACTION_TYPE_LABELS, type RecurringTemplate } from '@/types/api';
import { formatCurrency } from '@/utils/format';

const accountsStore = useAccountsStore();
const authStore = useAuthStore();
const categoriesStore = useCategoriesStore();
const dashboardStore = useDashboardStore();
const recurringStore = useRecurringStore();
const confirmDialog = useConfirm();
const toast = useToast();

const { error, isLoading, items } = storeToRefs(recurringStore);
const editing = ref<RecurringTemplate | null>(null);
const modalOpen = ref(false);

const columns = [
  { key: 'description', label: 'Descrição' },
  { key: 'type', label: 'Tipo' },
  { key: 'dayOfMonth', label: 'Dia' },
  { key: 'account', label: 'Conta' },
  { key: 'category', label: 'Categoria' },
  { key: 'memberProfile', label: 'Perfil' },
  { key: 'status', label: 'Status' },
  { key: 'amountCents', label: 'Valor', align: 'right' as const },
];

const ownAccounts = computed(() =>
  accountsStore.items.filter((account) => account.memberProfileId === authStore.user?.profileId),
);

onMounted(async () => {
  await Promise.all([accountsStore.refresh(), categoriesStore.refresh(), recurringStore.refresh()]);
});

function openCreate() {
  editing.value = null;
  modalOpen.value = true;
}

function openEdit(template: RecurringTemplate) {
  if (!canMutate(template)) return;
  editing.value = template;
  modalOpen.value = true;
}

async function save(payload: Parameters<typeof recurringStore.create>[0]) {
  try {
    if (editing.value) {
      await recurringStore.update(editing.value.id, payload);
      toast.success('Recorrente atualizado');
    } else {
      await recurringStore.create(payload);
      toast.success('Recorrente criado no seu perfil');
    }
    modalOpen.value = false;
    await Promise.all([recurringStore.refresh(), dashboardStore.refreshDashboard()]);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao salvar recorrente');
  }
}

async function toggleStatus(template: RecurringTemplate) {
  if (!canMutate(template)) return;
  const status = template.status === 'active' ? 'paused' : 'active';
  try {
    await recurringStore.update(template.id, { status });
    toast.success(status === 'active' ? 'Recorrente ativado' : 'Recorrente pausado');
    await Promise.all([recurringStore.refresh(), dashboardStore.refreshDashboard()]);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao alterar recorrente');
  }
}

async function remove(template: RecurringTemplate) {
  if (!canMutate(template)) return;
  const confirmed = await confirmDialog.confirm({
    title: 'Excluir recorrente',
    message: `Excluir "${template.description}"? Lançamentos já materializados não serão removidos automaticamente.`,
    confirmLabel: 'Excluir',
    destructive: true,
  });
  if (!confirmed) return;
  try {
    await recurringStore.remove(template.id);
    toast.success('Recorrente excluído');
    await Promise.all([recurringStore.refresh(), dashboardStore.refreshDashboard()]);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao excluir recorrente');
  }
}

function canMutate(template: RecurringTemplate) {
  return template.memberProfileId === authStore.user?.profileId;
}

function accountName(accountId?: string | null) {
  if (!accountId) return 'Sem conta';
  return accountsStore.items.find((account) => account.id === accountId)?.name ?? 'Conta';
}
</script>

<template>
  <AppShell>
    <section class="data-surface">
      <div class="section-head">
        <div>
          <h2>Recorrentes</h2>
          <span class="meta">{{ items.length }} cadastros familiares</span>
        </div>
        <button class="primary-btn" type="button" @click="openCreate">
          <IconGlyph name="plus" />
          Novo recorrente
        </button>
      </div>

      <div v-if="error" class="state-banner error" role="alert">
        {{ error }}
      </div>
      <div v-else-if="isLoading" class="state-banner">
        Carregando recorrentes...
      </div>

      <DataTable :columns="columns" :items="items" empty-label="Nenhum recorrente cadastrado">
        <template #cell-description="{ item }">
          <span class="strong">{{ item.description }}</span>
          <span v-if="item.notes" class="muted"> · {{ item.notes }}</span>
        </template>
        <template #cell-type="{ item }">
          {{ TRANSACTION_TYPE_LABELS[item.type] }}
        </template>
        <template #cell-dayOfMonth="{ item }">
          Dia {{ item.dayOfMonth }}
        </template>
        <template #cell-account="{ item }">
          {{ accountName(item.accountId) }}
        </template>
        <template #cell-category="{ item }">
          {{ item.category?.name ?? 'Sem categoria' }}
        </template>
        <template #cell-memberProfile="{ item }">
          {{ item.memberProfile?.displayName ?? 'Perfil' }}
        </template>
        <template #cell-status="{ item }">
          <span class="status-badge" :class="item.status">{{ RECURRING_STATUS_LABELS[item.status] }}</span>
        </template>
        <template #cell-amountCents="{ item }">
          <span class="num" :class="item.type">
            {{ item.type === 'expense' ? '-' : '+' }}{{ formatCurrency(Math.abs(item.amountCents)) }}
          </span>
        </template>
        <template #actions="{ item }">
          <div v-if="canMutate(item)" class="row-actions">
            <button class="quiet-btn" type="button" @click="toggleStatus(item)">
              {{ item.status === 'active' ? 'Pausar' : 'Ativar' }}
            </button>
            <button class="quiet-btn" type="button" @click="openEdit(item)">
              Editar
            </button>
            <button class="quiet-btn" type="button" @click="remove(item)">
              Excluir
            </button>
          </div>
          <span v-else class="muted">Somente leitura</span>
        </template>
      </DataTable>
    </section>

    <Modal :open="modalOpen" :title="editing ? 'Editar recorrente' : 'Novo recorrente'" @close="modalOpen = false">
      <RecurringForm
        :key="editing?.id ?? 'new'"
        :initial="editing"
        :accounts="ownAccounts"
        :categories="categoriesStore.items"
        :loading="isLoading"
        @cancel="modalOpen = false"
        @submit="save"
      />
    </Modal>
  </AppShell>
</template>
