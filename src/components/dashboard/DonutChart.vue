<script setup lang="ts">
import { computed } from 'vue';

import type { DashboardData } from '@/types/dashboard';
import { formatBRL } from '@/utils/format';

const props = defineProps<{
  data: DashboardData;
}>();

const size = 200;
const radius = 78;
const center = size / 2;
const stroke = 22;

const arcs = computed(() => {
  let offset = -Math.PI / 2;

  return props.data.donutSlices.map((slice) => {
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
});
</script>

<template>
  <article class="card">
    <div class="section-head">
      <h2>Despesas por categoria</h2>
      <span class="meta">{{ data.monthShort }}</span>
    </div>

    <div class="donut-row">
      <svg class="donut-svg" :viewBox="`0 0 ${size} ${size}`" role="img" aria-label="Despesas por categoria">
        <path
          v-for="arc in arcs"
          :key="arc.name"
          :d="arc.d"
          :stroke="arc.color"
          :stroke-width="stroke"
          fill="none"
          stroke-linecap="butt"
        />
        <text
          :x="center"
          :y="center - 4"
          text-anchor="middle"
          font-size="10"
          fill="var(--text-3)"
          class="chart-label"
        >
          TOTAL
        </text>
        <text
          :x="center"
          :y="center + 18"
          text-anchor="middle"
          font-size="20"
          fill="var(--text)"
          class="chart-value"
        >
          R$ {{ formatBRL(data.despesaTotalMes) }}
        </text>
      </svg>

      <div class="donut-legend">
        <div v-for="slice in data.donutSlices" :key="slice.name" class="legend-row">
          <span class="swatch" :style="{ background: slice.color }" />
          <span class="cat">{{ slice.name }}</span>
          <span class="pct">{{ (slice.pct * 100).toFixed(1) }}%</span>
          <span class="val">R$ {{ formatBRL(slice.value) }}</span>
        </div>
        <div v-if="data.donutSlices.length === 0" class="empty-panel">
          Sem despesas categorizadas
        </div>
      </div>
    </div>
  </article>
</template>
