<script setup lang="ts">
import { computed } from 'vue';

import type { DashboardData } from '@/types/dashboard';
import { formatBRL } from '@/utils/format';

import KpiCard from '@/components/dashboard/KpiCard.vue';

const props = defineProps<{
  data: DashboardData;
}>();

const sparkAtual = computed(() => props.data.saldoDiario.slice(0, 7));
const expAtual = computed(() => props.data.despesaDiariaSpark.slice(0, 7));
const carAtual = computed(() => props.data.cartaoDiariaSpark.slice(0, 7));
const saldoReferencia = computed(() => Math.max(Math.abs(props.data.saldoAnt), Math.abs(props.data.saldoFuturo), 1));
const progressAtual = computed(() => Math.abs(props.data.saldoAtual) / saldoReferencia.value);
const progressFuturo = computed(() => Math.abs(props.data.saldoFuturo) / saldoReferencia.value);
const despesaAtualDelta = computed(() =>
  safeDelta(props.data.despesaAtual, props.data.despesaAntMes / 2),
);
const despesaFuturoDelta = computed(() => safeDelta(props.data.despesaFuturo, props.data.despesaAntMes));
const cartaoAtualDelta = computed(() => safeDelta(props.data.cartaoAtual, props.data.cartaoAntMes / 2));
const cartaoFuturoDelta = computed(() => safeDelta(props.data.cartaoFuturo, props.data.cartaoAntMes));

function safeDelta(current: number, previous: number): number {
  if (!previous) return current ? 100 : 0;
  return Math.round((current / previous - 1) * 100);
}
</script>

<template>
  <section class="kpi-grid" aria-label="Indicadores principais">
    <KpiCard
      label="Saldo em conta · atual"
      :value="data.saldoAtual"
      :spark="sparkAtual"
      :sub="`saldo de abertura R$ ${formatBRL(data.saldoAnt)}`"
      :period-label="`1 → ${data.today}`"
      :progress-pct="progressAtual"
      variant="balance"
    />
    <KpiCard
      label="Saldo em conta · futuro"
      :value="data.saldoFuturo"
      :spark="data.saldoDiario"
      :sub="`receita prevista R$ ${formatBRL(data.receitaPrevista)}`"
      :period-label="data.monthShort"
      :progress-pct="progressFuturo"
      variant="balance"
    />

    <KpiCard
      label="Despesa do mês · atual"
      tag="conta + cartão"
      :value="data.despesaAtual"
      :spark="expAtual"
      :delta-pct="despesaAtualDelta"
      :delta-dir="despesaAtualDelta >= 0 ? 'up' : 'down'"
      :sub="`cartão R$ ${formatBRL(data.cartaoAtual)}`"
      :period-label="`até ${data.today}`"
      accent-color="var(--accent)"
    />
    <KpiCard
      label="Despesa do mês · futuro"
      tag="projeção total"
      :value="data.despesaFuturo"
      :spark="data.despesaDiariaSpark"
      :delta-pct="despesaFuturoDelta"
      :delta-dir="despesaFuturoDelta >= 0 ? 'up' : 'down'"
      :sub="`total do mês R$ ${formatBRL(data.despesaTotalMes)}`"
      :period-label="data.monthShort"
      accent-color="var(--accent-strong)"
    />

    <KpiCard
      label="Cartão de crédito · atual"
      tag="fatura aberta"
      :value="data.cartaoAtual"
      :spark="carAtual"
      :delta-pct="cartaoAtualDelta"
      :delta-dir="cartaoAtualDelta >= 0 ? 'up' : 'down'"
      sub="lançamentos confirmados até hoje"
      :period-label="data.monthShort"
      accent-color="var(--accent)"
    />
    <KpiCard
      label="Cartão de crédito · futuro"
      tag="com parcelas em aberto"
      :value="data.cartaoFuturo"
      :spark="data.cartaoDiariaSpark"
      :delta-pct="cartaoFuturoDelta"
      :delta-dir="cartaoFuturoDelta >= 0 ? 'up' : 'down'"
      :sub="`parcelas abertas ${data.parcelas.length}`"
      :period-label="data.monthShort"
      accent-color="var(--accent-strong)"
    />
  </section>
</template>
