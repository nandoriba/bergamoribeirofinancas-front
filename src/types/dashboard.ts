export type ThemeName = 'dark' | 'light';

export interface CategoryAmount {
  name: string;
  value: number;
  color: string;
}

export interface DonutSlice extends CategoryAmount {
  pct: number;
}

export interface AlertItem {
  kind: 'warn' | 'info';
  icon: 'card' | 'repeat' | 'split';
  title: string;
  sub: string;
  due: string;
  cta: string;
}

export interface InstallmentItem {
  name: string;
  pago: number;
  total: number;
  mensal: number;
  restante: number;
}

export interface MonthlyBalancePoint {
  m: string;
  v: number;
}

export interface TransactionItem {
  id: string;
  date: string;
  description: string;
  account: string;
  category: string;
  profile: string;
  type: 'income' | 'expense';
  value: number;
  status: 'confirmed' | 'pending' | 'duplicate';
}

export interface ImportPreviewRow {
  id: string;
  batchId: string;
  date: string;
  description: string;
  source: string;
  suggestedCategory: string;
  value: number;
  status: 'new' | 'duplicate' | 'review';
}

export interface DashboardData {
  monthRef: string;
  monthShort: string;
  today: string;
  saldoAtual: number;
  saldoFuturo: number;
  saldoAtualTotal: number;
  saldoProjetadoTotal: number;
  saldoAnt: number;
  saldoMaxMes: number;
  despesaAtual: number;
  despesaFuturo: number;
  despesaAntMes: number;
  cartaoAtual: number;
  cartaoFuturo: number;
  cartaoAntMes: number;
  parcelasConfirmadasQuantidade: number;
  parcelasConfirmadasValorCents: number;
  parcelasProjetadasQuantidade: number;
  parcelasProjetadasValorCents: number;
  receitaPrevista: number;
  top5: CategoryAmount[];
  outrosCat: number;
  avisos: AlertItem[];
  parcelas: InstallmentItem[];
  saldoMensal: MonthlyBalancePoint[];
  saldoDiario: number[];
  saldoDiarioAtual: number[];
  saldoDiarioProjetado: number[];
  despesaDiariaSpark: number[];
  despesaDiariaAtualSpark: number[];
  despesaDiariaProjetadaSpark: number[];
  cartaoDiariaSpark: number[];
  cartaoDiariaAtualSpark: number[];
  cartaoDiariaProjetadaSpark: number[];
  donutSlices: DonutSlice[];
  despesaTotalMes: number;
  transactions: TransactionItem[];
  importPreview: ImportPreviewRow[];
}
