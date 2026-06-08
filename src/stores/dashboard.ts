import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { apiFetch } from '@/lib/api';
import type { DashboardData, ImportPreviewRow } from '@/types/dashboard';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const useDashboardStore = defineStore('dashboard', () => {
  const selectedMonth = ref(toMonthKey(new Date()));
  const activeProfile = ref('Consolidado familiar');
  const data = ref<DashboardData>(createEmptyDashboard(selectedMonth.value));
  const isLoading = ref(false);
  const importLoading = ref(false);
  const error = ref<string | null>(null);
  const importBatchId = ref<string | null>(null);

  const monthLabel = computed(() => {
    const [year, month] = selectedMonth.value.split('-').map(Number);
    return `${MONTHS[month - 1]} ${year}`;
  });

  const isFutureMonth = computed(() => selectedMonth.value > toMonthKey(new Date()));

  function previousMonth() {
    selectedMonth.value = shiftMonth(selectedMonth.value, -1);
    void refreshDashboard();
  }

  function nextMonth() {
    selectedMonth.value = shiftMonth(selectedMonth.value, 1);
    void refreshDashboard();
  }

  function setProfile(profile: string) {
    activeProfile.value = profile;
    void refreshDashboard();
  }

  async function refreshDashboard() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await apiFetch<DashboardData>(`/dashboard?referenceMonth=${selectedMonth.value}&family=true`);
      data.value = response;
      importBatchId.value = response.importPreview[0]?.batchId ?? null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao carregar dashboard';
      data.value = createEmptyDashboard(selectedMonth.value);
    } finally {
      isLoading.value = false;
    }
  }

  async function previewImport(file: File) {
    importLoading.value = true;
    error.value = null;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiFetch<{ batchId: string; rows: ImportPreviewRow[] }>('/imports/preview', {
        method: 'POST',
        body: formData,
      });
      importBatchId.value = response.batchId;
      data.value = {
        ...data.value,
        importPreview: response.rows.map((row) => ({
          ...row,
          batchId: row.batchId || response.batchId,
          duplicateCandidates: row.duplicateCandidates ?? [],
        })),
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao importar CSV';
      throw err;
    } finally {
      importLoading.value = false;
    }
  }

  async function confirmImport(
    accountId?: string,
    acceptedPossibleDuplicateRowIds: string[] = [],
    confirmedDuplicateRowIds: string[] = [],
  ) {
    if (!importBatchId.value) return;
    importLoading.value = true;
    error.value = null;
    try {
      await apiFetch('/imports/confirm', {
        method: 'POST',
        body: {
          batchId: importBatchId.value,
          accountId: accountId || undefined,
          acceptedPossibleDuplicateRowIds,
          confirmedDuplicateRowIds,
        },
      });
      importBatchId.value = null;
      await refreshDashboard();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao confirmar importação';
      throw err;
    } finally {
      importLoading.value = false;
    }
  }

  async function discardImportPreview() {
    if (importLoading.value) return;

    const batchIds = new Set<string>();
    for (const row of data.value.importPreview) {
      if (row.batchId) {
        batchIds.add(row.batchId);
      }
    }

    if (importBatchId.value) {
      batchIds.add(importBatchId.value);
    }

    if (batchIds.size === 0) return;

    importLoading.value = true;
    error.value = null;
    try {
      await Promise.all(
        [...batchIds].map((batchId) =>
          apiFetch('/imports/discard', {
            method: 'POST',
            body: { batchId },
          }),
        ),
      );
      importBatchId.value = null;
      data.value = { ...data.value, importPreview: [] };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao descartar prévia';
      throw err;
    } finally {
      importLoading.value = false;
    }
  }

  return {
    activeProfile,
    confirmImport,
    data,
    discardImportPreview,
    error,
    importBatchId,
    importLoading,
    isLoading,
    isFutureMonth,
    monthLabel,
    nextMonth,
    previewImport,
    previousMonth,
    refreshDashboard,
    setProfile,
    selectedMonth,
  };
});

function createEmptyDashboard(monthRef: string): DashboardData {
  const [year, month] = monthRef.split('-').map(Number);
  return {
    monthRef,
    monthShort: `${MONTHS[month - 1]} ${year}`,
    today: '',
    saldoAtual: 0,
    saldoFuturo: 0,
    saldoAtualTotal: 0,
    saldoProjetadoTotal: 0,
    saldoAnt: 0,
    saldoMaxMes: 0,
    despesaAtual: 0,
    despesaFuturo: 0,
    despesaAntMes: 0,
    cartaoAtual: 0,
    cartaoFuturo: 0,
    cartaoAntMes: 0,
    parcelasConfirmadasQuantidade: 0,
    parcelasConfirmadasValorCents: 0,
    parcelasProjetadasQuantidade: 0,
    parcelasProjetadasValorCents: 0,
    receitaPrevista: 0,
    top5: [],
    outrosCat: 0,
    avisos: [],
    parcelas: [],
    saldoMensal: Array.from({ length: 12 }, (_, index) => ({ m: MONTHS[index], v: 0 })),
    saldoDiario: new Array(31).fill(0),
    saldoDiarioAtual: new Array(31).fill(0),
    saldoDiarioProjetado: new Array(31).fill(0),
    despesaDiariaSpark: new Array(31).fill(0),
    despesaDiariaAtualSpark: new Array(31).fill(0),
    despesaDiariaProjetadaSpark: new Array(31).fill(0),
    cartaoDiariaSpark: new Array(31).fill(0),
    cartaoDiariaAtualSpark: new Array(31).fill(0),
    cartaoDiariaProjetadaSpark: new Array(31).fill(0),
    donutSlices: [],
    despesaTotalMes: 0,
    saldoComposicaoConfirmada: {
      title: 'Composição confirmada',
      totalLabel: 'CONFIRMADO',
      totalValue: 0,
      slices: [],
    },
    saldoComposicaoProjetada: {
      title: 'Composição projetada',
      totalLabel: 'PROJETADO',
      totalValue: 0,
      slices: [],
    },
    transactions: [],
    importPreview: [],
  };
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(monthKey: string, amount: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return toMonthKey(date);
}
