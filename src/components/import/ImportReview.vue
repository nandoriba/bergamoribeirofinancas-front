<script setup lang="ts">
import { ref } from 'vue';

import type { ImportPreviewRow } from '@/types/dashboard';
import { formatCurrency } from '@/utils/format';

import IconGlyph from '@/components/common/IconGlyph.vue';

defineProps<{
  rows: ImportPreviewRow[];
  loading: boolean;
  confirmDisabled?: boolean;
  confirmHint?: string;
}>();

const emit = defineEmits<{
  selectFile: [file: File];
  confirm: [];
  discard: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const statusLabel: Record<ImportPreviewRow['status'], string> = {
  new: 'Novo',
  duplicate: 'Duplicado',
  review: 'Revisar',
};

function openFileDialog() {
  fileInput.value?.click();
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    emit('selectFile', file);
  }
  input.value = '';
}
</script>

<template>
  <section class="import-review">
    <div class="upload-panel">
      <div class="upload-icon">
        <IconGlyph name="file" :size="22" />
      </div>
      <div>
        <h2>Importação CSV</h2>
        <p>Nubank conta corrente e fatura de cartão</p>
      </div>
      <div class="upload-actions">
        <button class="quiet-btn" type="button">
          <IconGlyph name="download" :size="15" />
          Modelo CSV
        </button>
        <input
          ref="fileInput"
          class="visually-hidden"
          type="file"
          accept=".csv,text/csv"
          @change="handleFileChange"
        >
        <button class="primary-btn" type="button" :disabled="loading" @click="openFileDialog">
          <IconGlyph name="upload" :size="15" />
          {{ loading ? 'Processando...' : 'Selecionar arquivo' }}
        </button>
      </div>
    </div>

    <div class="data-surface">
      <div class="section-head">
        <h2>Prévia de revisão</h2>
        <span class="meta">{{ rows.length }} linhas</span>
      </div>

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Origem</th>
              <th>Categoria sugerida</th>
              <th>Status</th>
              <th class="num-col">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td class="num">
                {{ row.date }}
              </td>
              <td class="strong">
                {{ row.description }}
              </td>
              <td>{{ row.source }}</td>
              <td>{{ row.suggestedCategory }}</td>
              <td>
                <span class="status-badge" :class="row.status">{{ statusLabel[row.status] }}</span>
                <span v-if="row.falseDuplicate" class="status-badge false-duplicate">Falsa duplicidade</span>
              </td>
              <td class="num num-col" :class="row.value < 0 ? 'expense' : 'income'">
                {{ row.value < 0 ? '-' : '+' }}{{ formatCurrency(Math.abs(row.value)) }}
              </td>
            </tr>
            <tr v-if="rows.length === 0">
              <td colspan="6" class="empty-cell">
                Nenhuma prévia carregada
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="review-actions">
        <span v-if="confirmHint" class="field-hint">{{ confirmHint }}</span>
        <button class="quiet-btn" type="button" :disabled="rows.length === 0 || loading" @click="$emit('discard')">
          Descartar
        </button>
        <button
          class="primary-btn"
          type="button"
          :disabled="rows.length === 0 || loading || confirmDisabled"
          @click="$emit('confirm')"
        >
          <IconGlyph name="check" :size="15" />
          {{ loading ? 'Confirmando...' : 'Confirmar importação' }}
        </button>
      </div>
    </div>
  </section>
</template>
