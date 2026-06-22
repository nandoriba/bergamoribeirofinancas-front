<script setup lang="ts">
import { ref } from 'vue';

import type { ImportPreviewRow, PossibleDuplicateDecision } from '@/types/dashboard';
import { formatCurrency } from '@/utils/format';

import IconGlyph from '@/components/common/IconGlyph.vue';

const props = defineProps<{
  rows: ImportPreviewRow[];
  loading: boolean;
  confirmDisabled?: boolean;
  confirmHint?: string;
  possibleDuplicateDecisions: Record<string, PossibleDuplicateDecision>;
  invoiceAdjustmentDecisions: Record<string, boolean>;
}>();

const emit = defineEmits<{
  selectFile: [file: File];
  confirm: [];
  discard: [];
  decidePossibleDuplicate: [rowId: string, decision: PossibleDuplicateDecision];
  decideInvoiceAdjustment: [rowId: string, selected: boolean];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const expandedRowIds = ref<string[]>([]);

const statusLabel: Record<ImportPreviewRow['status'], string> = {
  new: 'Novo',
  duplicate: 'Duplicado',
  possible_duplicate: 'Possível Duplicidade',
  review: 'Não será importado',
};

const statusClass: Record<ImportPreviewRow['status'], string> = {
  new: 'new',
  duplicate: 'duplicate',
  possible_duplicate: 'possible-duplicate',
  review: 'review',
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

function formatApplicationDate(value: string | null) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatSignedCurrency(value: number) {
  return `${value < 0 ? '-' : '+'}${formatCurrency(Math.abs(value))}`;
}

function isExpanded(rowId: string) {
  return expandedRowIds.value.includes(rowId);
}

function toggleDetails(rowId: string) {
  expandedRowIds.value = isExpanded(rowId)
    ? expandedRowIds.value.filter((id) => id !== rowId)
    : [...expandedRowIds.value, rowId];
}

function isDecisionableDuplicate(row: ImportPreviewRow) {
  return row.status === 'possible_duplicate' || (row.status === 'duplicate' && row.duplicateCandidates.length > 0);
}

function decisionValue(row: ImportPreviewRow) {
  return props.possibleDuplicateDecisions[row.id] ?? (row.status === 'duplicate' ? 'duplicate' : '');
}

function decide(rowId: string, decision: PossibleDuplicateDecision) {
  emit('decidePossibleDuplicate', rowId, decision);
}

function handleDecisionChange(rowId: string, event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (value === 'not_duplicate' || value === 'duplicate') {
    decide(rowId, value);
  }
}

function isInvoiceAdjustmentSelected(row: ImportPreviewRow) {
  return props.invoiceAdjustmentDecisions[row.id] ?? row.invoiceAdjustmentDefault ?? false;
}

function handleInvoiceAdjustmentChange(rowId: string, event: Event) {
  emit('decideInvoiceAdjustment', rowId, (event.target as HTMLInputElement).checked);
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
              <th>Data de aplicação</th>
              <th>Descrição</th>
              <th>Origem</th>
              <th>Categoria sugerida</th>
              <th>Status</th>
              <th>Confirmação</th>
              <th class="num-col">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in rows" :key="row.id">
              <tr>
                <td class="num">
                  {{ formatApplicationDate(row.applicationDate) }}
                </td>
                <td class="strong">
                  {{ row.description }}
                </td>
                <td>{{ row.source }}</td>
                <td>{{ row.suggestedCategory }}</td>
                <td>
                  <div class="status-cell">
                    <span class="status-badge" :class="statusClass[row.status]">{{ statusLabel[row.status] }}</span>
                    <button
                      v-if="isDecisionableDuplicate(row)"
                      class="inline-icon-btn"
                      type="button"
                      :aria-expanded="isExpanded(row.id)"
                      :aria-label="`${isExpanded(row.id) ? 'Ocultar' : 'Ver'} duplicidades encontradas de ${row.description}`"
                      :title="`${isExpanded(row.id) ? 'Ocultar' : 'Ver'} duplicidades encontradas`"
                      @click="toggleDetails(row.id)"
                    >
                      <IconGlyph name="info" :size="14" />
                    </button>
                    <span v-if="row.status === 'review' && row.reviewReason" class="review-reason">
                      {{ row.reviewReason }}
                    </span>
                  </div>
                </td>
                <td>
                  <div
                    v-if="isDecisionableDuplicate(row) || row.invoiceAdjustmentCandidate"
                    class="import-confirmation-stack"
                  >
                    <div v-if="isDecisionableDuplicate(row)" class="duplicate-decision-group">
                      <select
                        class="form-control duplicate-decision-select"
                        :value="decisionValue(row)"
                        :aria-label="`Decisão da duplicidade de ${row.description}`"
                        @change="handleDecisionChange(row.id, $event)"
                      >
                        <option value="" disabled>
                          Escolha
                        </option>
                        <option value="not_duplicate">
                          Não é duplicidade
                        </option>
                        <option value="duplicate">
                          Confirmar duplicidade
                        </option>
                      </select>
                    </div>
                    <label v-if="row.invoiceAdjustmentCandidate" class="invoice-adjustment-check">
                      <input
                        type="checkbox"
                        :checked="isInvoiceAdjustmentSelected(row)"
                        :aria-label="`Compor somente a fatura para ${row.description}`"
                        @change="handleInvoiceAdjustmentChange(row.id, $event)"
                      >
                      <span>Somente fatura</span>
                    </label>
                  </div>
                  <span v-else class="muted-cell">-</span>
                </td>
                <td class="num num-col" :class="row.value < 0 ? 'expense' : 'income'">
                  {{ row.value < 0 ? '-' : '+' }}{{ formatCurrency(Math.abs(row.value)) }}
                </td>
              </tr>
              <tr
                v-if="isDecisionableDuplicate(row) && isExpanded(row.id)"
                class="duplicate-detail-row"
              >
                <td colspan="7">
                  <div class="duplicate-detail">
                    <div class="duplicate-detail-head">
                      <strong>Itens encontrados com mesmo valor e data de aplicação</strong>
                      <span>{{ row.duplicateCandidates.length }} candidato(s)</span>
                    </div>
                    <div class="duplicate-candidates">
                      <div
                        v-for="candidate in row.duplicateCandidates"
                        :key="`${candidate.source}-${candidate.id ?? candidate.description}-${candidate.applicationDate}`"
                        class="duplicate-candidate"
                      >
                        <span>{{ candidate.source }}</span>
                        <strong>{{ candidate.description }}</strong>
                        <span>{{ formatApplicationDate(candidate.applicationDate) }}</span>
                        <span>{{ formatSignedCurrency(candidate.amountCents) }}</span>
                        <span v-if="candidate.accountName">{{ candidate.accountName }}</span>
                      </div>
                      <p v-if="row.duplicateCandidates.length === 0" class="duplicate-empty">
                        Nenhuma referência de comparação foi retornada pela API para esta linha.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="rows.length === 0">
              <td colspan="7" class="empty-cell">
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
