import { apiFetch } from '@/lib/api';
import { buildQuery } from '@/services/_base';
import type { MonthlyReport } from '@/types/api';

export interface MonthlyReportRange {
  from: string;
  to: string;
  months: MonthlyReport[];
}

export interface ReportQuery {
  from?: string;
  to?: string;
  month?: string;
  family?: boolean;
}

export const reportsService = {
  monthly(query: ReportQuery) {
    return apiFetch<MonthlyReport | MonthlyReportRange>(`/reports/monthly${buildQuery(query as Record<string, boolean | string | undefined>)}`);
  },
};
