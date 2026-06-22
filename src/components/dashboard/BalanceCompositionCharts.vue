<script setup lang="ts">
import type { BalanceComposition, DashboardData, DonutSlice } from '@/types/dashboard';
import { formatBRL } from '@/utils/format';

const props = defineProps<{
  data: DashboardData;
}>();

const size = 168;
const radius = 64;
const center = size / 2;
const stroke = 18;

function buildArcs(slices: DonutSlice[]) {
  let offset = -Math.PI / 2;

  return slices.map((slice) => {
    const angle = slice.pct * Math.PI * 2;
    const x1 = center + radius * Math.cos(offset);
    const y1 = center + radius * Math.sin(offset);
    offset += angle;
    const x2 = center + radius * Math.cos(offset);
    const y2 = center + radius * Math.sin(offset);
    const large = angle > Math.PI ? 1 : 0;

    return {
      ...slice,
      d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`,
    };
  });
}

function charts(): BalanceComposition[] {
  return [props.data.saldoComposicaoConfirmada, props.data.saldoComposicaoProjetada];
}
</script>

<template>
  <article v-for="chart in charts()" :key="chart.title" class="card balance-composition-card">
    <div class="section-head">
      <h2>{{ chart.title }}</h2>
      <span class="meta">{{ data.monthShort }}</span>
    </div>

    <div class="balance-donut-row">
      <svg
        class="balance-donut-svg"
        :viewBox="`0 0 ${size} ${size}`"
        role="img"
        :aria-label="chart.title"
      >
        <path
          v-for="arc in buildArcs(chart.slices)"
          :key="arc.name"
          :d="arc.d"
          :stroke="arc.color"
          :stroke-width="stroke"
          fill="none"
          stroke-linecap="butt"
        />
        <text
          :x="center"
          :y="center + 4"
          text-anchor="middle"
          font-size="9"
          fill="var(--text-3)"
          class="chart-label"
        >
          {{ chart.totalLabel }}
        </text>
      </svg>

      <div class="donut-legend balance-donut-legend">
        <div v-for="slice in chart.slices" :key="slice.name" class="legend-row">
          <span class="swatch" :style="{ background: slice.color }" />
          <span class="cat">{{ slice.name }}</span>
          <span class="pct">{{ (slice.pct * 100).toFixed(1) }}%</span>
          <span class="val">R$ {{ formatBRL(slice.value) }}</span>
        </div>
        <div v-if="chart.slices.length === 0" class="empty-panel">
          Sem dados no mês
        </div>
      </div>
    </div>
  </article>
</template>
