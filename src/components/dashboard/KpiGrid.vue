<script setup lang="ts">
import { computed } from 'vue';

import type { DashboardData } from '@/types/dashboard';
import { formatBRL } from '@/utils/format';

import KpiCard from '@/components/dashboard/KpiCard.vue';

const props = defineProps<{
  data: DashboardData;
}>();

const sparkAtual = computed(() => props.data.saldoDiarioAtual ?? props.data.saldoDiario);
const sparkFuturo = computed(() => props.data.saldoDiarioProjetado ?? props.data.saldoDiario);
const expAtual = computed(() => props.data.despesaDiariaAtualSpark ?? props.data.despesaDiariaSpark);
const expFuturo = computed(() => props.data.despesaDiariaProjetadaSpark ?? props.data.despesaDiariaSpark);
const carAtual = computed(() => props.data.cartaoDiariaAtualSpark ?? props.data.cartaoDiariaSpark);
const carFuturo = computed(() => props.data.cartaoDiariaProjetadaSpark ?? props.data.cartaoDiariaSpark);
const saldoReferencia = computed(() => Math.max(Math.abs(props.data.saldoAnt), Math.abs(props.data.saldoFuturo), 1));
const progressAtual = computed(() => Math.abs(props.data.saldoAtual) / saldoReferencia.value);
const progressFuturo = computed(() => Math.abs(props.data.saldoFuturo) / saldoReferencia.value);
const despesaAtualDelta = computed(() => safeDelta(props.data.despesaAtual, props.data.despesaAntMes));
const despesaFuturoDelta = computed(() => safeDelta(props.data.despesaFuturo, props.data.despesaAntMes));
const cartaoAtualDelta = computed(() => safeDelta(props.data.cartaoAtual, props.data.cartaoAntMes));
const cartaoFuturoDelta = computed(() => safeDelta(props.data.cartaoFuturo, props.data.cartaoAntMes));

function safeDelta(current: number, previous: number): number {
  if (!previous) return current ? 100 : 0;
  return Math.round((current / previous - 1) * 100);
}
</script>

<template>
  <section class="kpi-grid" aria-label="Indicadores principais">
    <KpiCard
      label="Saldo em conta · confirmado"
      :value="data.saldoAtual"
      :spark="sparkAtual"
      :sub="`Saldo atual total R$ ${formatBRL(data.saldoAtualTotal)}`"
      :period-label="data.monthShort"
      :progress-pct="progressAtual"
      variant="balance"
    />
    <KpiCard
      label="Saldo em conta · projetado"
      :value="data.saldoFuturo"
      :spark="sparkFuturo"
      :sub="`Saldo total projetado R$ ${formatBRL(data.saldoProjetadoTotal)}`"
      :period-label="data.monthShort"
      :progress-pct="progressFuturo"
      variant="balance"
    />

    <KpiCard
      label="Despesa do mês · confirmada"
      tag="referência"
      :value="data.despesaAtual"
      :spark="expAtual"
      :delta-pct="despesaAtualDelta"
      :delta-dir="despesaAtualDelta >= 0 ? 'up' : 'down'"
      :sub="`cartão atual R$ ${formatBRL(data.cartaoAtual)}`"
      :period-label="data.monthShort"
      accent-color="var(--accent)"
    />
    <KpiCard
      label="Despesa do mês · projetada"
      tag="projeção total"
      :value="data.despesaFuturo"
      :spark="expFuturo"
      :delta-pct="despesaFuturoDelta"
      :delta-dir="despesaFuturoDelta >= 0 ? 'up' : 'down'"
      :sub="`cartão projetado R$ ${formatBRL(data.cartaoFuturo)}`"
      :period-label="data.monthShort"
      accent-color="var(--accent-strong)"
    />

    <KpiCard
      label="Cartão de crédito · confirmado"
      tag="referência"
      :value="data.cartaoAtual"
      :spark="carAtual"
      :delta-pct="cartaoAtualDelta"
      :delta-dir="cartaoAtualDelta >= 0 ? 'up' : 'down'"
      :sub="`Parcelas confirmadas ${data.parcelasConfirmadasQuantidade} · R$ ${formatBRL(data.parcelasConfirmadasValorCents)}`"
      :period-label="data.monthShort"
      accent-color="var(--accent)"
    />
    <KpiCard
      label="Cartão de crédito · projetado"
      tag="com parcelas em aberto"
      :value="data.cartaoFuturo"
      :spark="carFuturo"
      :delta-pct="cartaoFuturoDelta"
      :delta-dir="cartaoFuturoDelta >= 0 ? 'up' : 'down'"
      :sub="`Parcelas projetadas ${data.parcelasProjetadasQuantidade} · R$ ${formatBRL(data.parcelasProjetadasValorCents)}`"
      :period-label="data.monthShort"
      accent-color="var(--accent-strong)"
    />
  </section>
</template>
