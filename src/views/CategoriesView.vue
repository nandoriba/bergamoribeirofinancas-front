<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';

import DataTable from '@/components/common/DataTable.vue';
import IconGlyph from '@/components/common/IconGlyph.vue';
import Modal from '@/components/common/Modal.vue';
import AppShell from '@/components/layout/AppShell.vue';
import CategoryForm from '@/components/forms/CategoryForm.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import { useCategoriesStore } from '@/stores/categories';
import { CATEGORY_TYPE_LABELS, type Category } from '@/types/api';

const categoriesStore = useCategoriesStore();
const { error, isLoading, items } = storeToRefs(categoriesStore);
const confirmDialog = useConfirm();
const toast = useToast();

const editing = ref<Category | null>(null);
const modalOpen = ref(false);

const columns = [
  { key: 'name', label: 'Categoria' },
  { key: 'type', label: 'Tipo' },
  { key: 'aliases', label: 'Aliases' },
  { key: 'color', label: 'Cor' },
];

onMounted(() => {
  void categoriesStore.refresh();
});

function openCreate() {
  editing.value = null;
  modalOpen.value = true;
}

function openEdit(category: Category) {
  editing.value = category;
  modalOpen.value = true;
}

async function save(payload: Parameters<typeof categoriesStore.create>[0]) {
  try {
    if (editing.value) {
      await categoriesStore.update(editing.value.id, payload);
      toast.success('Categoria atualizada');
    } else {
      await categoriesStore.create(payload);
      toast.success('Categoria criada');
    }
    modalOpen.value = false;
    await categoriesStore.refresh();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao salvar categoria');
  }
}

async function remove(category: Category) {
  const confirmed = await confirmDialog.confirm({
    title: 'Excluir categoria',
    message: `Excluir "${category.name}"? Lançamentos existentes podem ficar sem categoria.`,
    confirmLabel: 'Excluir',
    destructive: true,
  });
  if (!confirmed) return;
  try {
    await categoriesStore.remove(category.id);
    toast.success('Categoria excluída');
    await categoriesStore.refresh();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Falha ao excluir categoria');
  }
}
</script>

<template>
  <AppShell>
    <section class="data-surface">
      <div class="section-head">
        <div>
          <h2>Categorias</h2>
          <span class="meta">{{ items.length }} cadastros</span>
        </div>
        <button class="primary-btn" type="button" @click="openCreate">
          <IconGlyph name="plus" />
          Nova categoria
        </button>
      </div>

      <div v-if="error" class="state-banner error" role="alert">
        {{ error }}
      </div>
      <div v-else-if="isLoading" class="state-banner">
        Carregando categorias...
      </div>

      <DataTable :columns="columns" :items="items" empty-label="Nenhuma categoria cadastrada">
        <template #cell-type="{ item }">
          {{ CATEGORY_TYPE_LABELS[item.type] }}
        </template>
        <template #cell-aliases="{ item }">
          <span class="muted">{{ item.aliases.length ? item.aliases.join(', ') : 'Sem aliases' }}</span>
        </template>
        <template #cell-color="{ item }">
          <span class="color-chip">
            <span class="color-swatch" :style="{ background: item.color }" />
            {{ item.color }}
          </span>
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

    <Modal :open="modalOpen" :title="editing ? 'Editar categoria' : 'Nova categoria'" @close="modalOpen = false">
      <CategoryForm
        :key="editing?.id ?? 'new'"
        :initial="editing"
        :loading="isLoading"
        @cancel="modalOpen = false"
        @submit="save"
      />
    </Modal>
  </AppShell>
</template>
