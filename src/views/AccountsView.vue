<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';

import DataTable from '@/components/common/DataTable.vue';
import IconGlyph from '@/components/common/IconGlyph.vue';
import Modal from '@/components/common/Modal.vue';
import AccountForm from '@/components/forms/AccountForm.vue';
import AppShell from '@/components/layout/AppShell.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import { useAccountsStore } from '@/stores/accounts';
import { ACCOUNT_TYPE_LABELS, type Account } from '@/types/api';
import { formatCurrency } from '@/utils/format';

const accountsStore = useAccountsStore();
const { error, isLoading, items } = storeToRefs(accountsStore);
const confirmDialog = useConfirm();
const toast = useToast();

const editing = ref<Account | null>(null);
const modalOpen = ref(false);

const columns = [
  { key: 'name', label: 'Conta' },
  { key: 'type', label: 'Tipo' },
  { key: 'memberProfile', label: 'Perfil' },
  { key: 'institution', label: 'Instituição' },
  { key: 'initialBalanceCents', label: 'Saldo inicial', align: 'right' as const },
];

onMounted(() => {
  void accountsStore.refresh();
});

function openCreate() {
  editing.value = null;
  modalOpen.value = true;
}

function openEdit(account: Account) {
  editing.value = account;
  modalOpen.value = true;
}

async function save(payload: Parameters<typeof accountsStore.create>[0]) {
  try {
    if (editing.value) {
      await accountsStore.update(editing.value.id, payload);
      toast.success('Conta atualizada');
    } else {
      await accountsStore.create(payload);
      toast.success('Conta criada no seu perfil');
    }
    modalOpen.value = false;
    await accountsStore.refresh();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao salvar conta');
  }
}

async function remove(account: Account) {
  const confirmed = await confirmDialog.confirm({
    title: 'Excluir conta',
    message: `Excluir "${account.name}"? Lançamentos vinculados podem perder a conta.`,
    confirmLabel: 'Excluir',
    destructive: true,
  });
  if (!confirmed) return;
  try {
    await accountsStore.remove(account.id);
    toast.success('Conta excluída');
    await accountsStore.refresh();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao excluir conta');
  }
}
</script>

<template>
  <AppShell>
    <section class="data-surface">
      <div class="section-head">
        <div>
          <h2>Contas</h2>
          <span class="meta">{{ items.length }} cadastros familiares</span>
        </div>
        <button class="primary-btn" type="button" @click="openCreate">
          <IconGlyph name="plus" />
          Nova conta
        </button>
      </div>

      <div v-if="error" class="state-banner error" role="alert">
        {{ error }}
      </div>
      <div v-else-if="isLoading" class="state-banner">
        Carregando contas...
      </div>

      <DataTable :columns="columns" :items="items" empty-label="Nenhuma conta cadastrada">
        <template #cell-name="{ item }">
          <span class="strong">{{ item.name }}</span>
          <span v-if="item.lastFourDigits" class="muted"> · {{ item.lastFourDigits }}</span>
        </template>
        <template #cell-type="{ item }">
          {{ ACCOUNT_TYPE_LABELS[item.type] }}
        </template>
        <template #cell-memberProfile="{ item }">
          {{ item.memberProfile?.displayName ?? 'Perfil' }}
        </template>
        <template #cell-institution="{ item }">
          {{ item.institution ?? 'Não informada' }}
        </template>
        <template #cell-initialBalanceCents="{ item }">
          {{ formatCurrency(item.initialBalanceCents) }}
        </template>
        <template #actions="{ item }">
          <div class="row-actions">
            <button class="quiet-btn" type="button" @click="openEdit(item)">
              Editar
            </button>
            <button class="quiet-btn" type="button" @click="remove(item)">
              Excluir
            </button>
          </div>
        </template>
      </DataTable>
    </section>

    <Modal :open="modalOpen" :title="editing ? 'Editar conta' : 'Nova conta'" @close="modalOpen = false">
      <AccountForm
        :key="editing?.id ?? 'new'"
        :initial="editing"
        :loading="isLoading"
        @cancel="modalOpen = false"
        @submit="save"
      />
    </Modal>
  </AppShell>
</template>
