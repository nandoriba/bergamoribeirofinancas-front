<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, reactive } from 'vue';

import DataTable from '@/components/common/DataTable.vue';
import DateInput from '@/components/common/DateInput.vue';
import FormField from '@/components/common/FormField.vue';
import IconGlyph from '@/components/common/IconGlyph.vue';
import AppShell from '@/components/layout/AppShell.vue';
import { useReportsStore } from '@/stores/reports';
import { formatCurrency } from '@/utils/format';

const reportsStore = useReportsStore();
const { data, error, isLoading } = storeToRefs(reportsStore);

const filters = reactive({
  from: shiftMonth(toCurrentMonth(), -5),
  to: toCurrentMonth(),
});

const columns = [
  { key: 'month', label: 'Mês' },
  { key: 'incomeCents', label: 'Receitas', align: 'right' as const },
  { key: 'expenseCents', label: 'Despesas', align: 'right' as const },
  { key: 'netCents', label: 'Resultado', align: 'right' as const },
];

const rows = computed(() =>
  (data.value?.months ?? []).map((month) => ({
    id: month.month,
    ...month,
    incomeCents: month.totals.incomeCents,
    expenseCents: month.totals.expenseCents,
    netCents: month.totals.netCents,
  })),
);

const totals = computed(() =>
  rows.value.reduce(
    (acc, row) => ({
      incomeCents: acc.incomeCents + row.incomeCents,
      expenseCents: acc.expenseCents + row.expenseCents,
      netCents: acc.netCents + row.netCents,
    }),
    { incomeCents: 0, expenseCents: 0, netCents: 0 },
  ),
);

const topCategories = computed(() => {
  const categories = new Map<string, { name: string; valueCents: number; color: string }>();
  for (const month of data.value?.months ?? []) {
    for (const category of month.categories) {
      if (category.type !== 'expense') continue;
      const current = categories.get(category.name) ?? { name: category.name, valueCents: 0, color: category.color };
      current.valueCents += category.valueCents;
      categories.set(category.name, current);
    }
  }
  return [...categories.values()].sort((a, b) => b.valueCents - a.valueCents).slice(0, 8);
});

onMounted(() => {
  void fetchReport();
});

async function fetchReport() {
  await reportsStore.fetchMonthly({ from: filters.from, to: filters.to, family: true });
}

function exportCsv() {
  const csv = [
    ['Mes', 'Receitas', 'Despesas', 'Resultado'],
    ...rows.value.map((row) => [row.month, row.incomeCents, row.expenseCents, row.netCents]),
  ]
    .map((line) => line.join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `relatorio-${filters.from}-${filters.to}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCurrentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(monthKey: string, amount: number) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(value: string) {
  const [year, month] = value.split('-');
  return `${month}/${year}`;
}

function maxCategoryValue(items: Array<{ valueCents: number }>) {
  return Math.max(...items.map((item) => item.valueCents), 1);
}
</script>

<template>
  <AppShell>
    <section class="data-surface">
      <div class="section-head">
        <div>
          <h2>Relatórios</h2>
          <span class="meta">{{ rows.length }} meses no intervalo</span>
        </div>
        <button class="quiet-btn" type="button" :disabled="rows.length === 0" @click="exportCsv">
          <IconGlyph name="download" />
          Exportar CSV
        </button>
      </div>

      <div class="filter-strip">
        <FormField label="De">
          <DateInput v-model="filters.from" type="month" />
        </FormField>
        <FormField label="Até">
          <DateInput v-model="filters.to" type="month" />
        </FormField>
        <button class="primary-btn" type="button" :disabled="isLoading" @click="fetchReport">
          Atualizar
        </button>
      </div>

      <div v-if="error" class="state-banner error" role="alert">
        {{ error }}
      </div>
      <div v-else-if="isLoading" class="state-banner">
        Carregando relatório...
      </div>

      <div class="report-summary">
        <div>
          <span>Receitas</span>
          <strong class="income">{{ formatCurrency(totals.incomeCents) }}</strong>
        </div>
        <div>
          <span>Despesas</span>
          <strong class="expense">{{ formatCurrency(totals.expenseCents) }}</strong>
        </div>
        <div>
          <span>Resultado</span>
          <strong :class="totals.netCents >= 0 ? 'income' : 'expense'">{{ formatCurrency(totals.netCents) }}</strong>
        </div>
      </div>

      <DataTable :columns="columns" :items="rows" empty-label="Nenhum dado no intervalo">
        <template #cell-month="{ item }">
          {{ formatMonth(item.month) }}
        </template>
        <template #cell-incomeCents="{ item }">
          <span class="income">{{ formatCurrency(item.incomeCents) }}</span>
        </template>
        <template #cell-expenseCents="{ item }">
          <span class="expense">{{ formatCurrency(item.expenseCents) }}</span>
        </template>
        <template #cell-netCents="{ item }">
          <span :class="item.netCents >= 0 ? 'income' : 'expense'">{{ formatCurrency(item.netCents) }}</span>
        </template>
      </DataTable>
    </section>

    <section class="data-surface">
      <div class="section-head">
        <h2>Categorias no intervalo</h2>
        <span class="meta">{{ topCategories.length }} categorias</span>
      </div>
      <div class="report-bars">
        <div v-for="category in topCategories" :key="category.name" class="report-bar">
          <div class="top5-head">
            <span class="color-swatch" :style="{ background: category.color }" />
            <span class="name">{{ category.name }}</span>
            <span class="val">{{ formatCurrency(category.valueCents) }}</span>
          </div>
          <div class="bar-row">
            <span :style="{ width: `${(category.valueCents / maxCategoryValue(topCategories)) * 100}%`, background: category.color }" />
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>
