import { defineStore } from 'pinia';
import { ref } from 'vue';

import { reportsService, type MonthlyReportRange, type ReportQuery } from '@/services/reports';
import type { MonthlyReport } from '@/types/api';

export const useReportsStore = defineStore('reports', () => {
  const data = ref<MonthlyReportRange | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchMonthly(query: ReportQuery) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await reportsService.monthly(query);
      data.value = isRange(response)
        ? response
        : {
            from: response.month,
            to: response.month,
            months: [response],
          };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao carregar relatórios';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return { data, error, fetchMonthly, isLoading };
});

function isRange(value: MonthlyReport | MonthlyReportRange): value is MonthlyReportRange {
  return 'months' in value;
}
