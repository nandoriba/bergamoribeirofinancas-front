<script setup lang="ts">
import { computed } from 'vue';

import type { DashboardData } from '@/types/dashboard';
import { buildSmoothPath } from '@/utils/chart';
import { formatAxisCurrency, formatBRL } from '@/utils/format';

const props = defineProps<{
  data: DashboardData;
}>();

const width = 580;
const height = 220;
const padL = 44;
const padR = 16;
const padT = 18;
const padB = 36;
const innerW = width - padL - padR;
const innerH = height - padT - padB;

const values = computed(() => props.data.saldoMensal.map((point) => point.v));
const min = computed(() => Math.min(...values.value, 0));
const max = computed(() => Math.max(...values.value));
const range = computed(() => max.value - min.value || 1);

function yScale(value: number): number {
  return padT + (1 - (value - min.value) / range.value) * innerH;
}

function xScale(index: number): number {
  return padL + (index / Math.max(props.data.saldoMensal.length - 1, 1)) * innerW;
}

const points = computed(() =>
  props.data.saldoMensal.map((point, index) => ({
    label: point.m,
    value: point.v,
    x: xScale(index),
    y: yScale(point.v),
  })),
);

const path = computed(() => buildSmoothPath(points.value));
const fillPath = computed(
  () =>
    `${path.value} L ${xScale(props.data.saldoMensal.length - 1)} ${padT + innerH} L ${xScale(0)} ${
      padT + innerH
    } Z`,
);
const yTicks = computed(() =>
  Array.from({ length: 5 }, (_, index) => min.value + (max.value - min.value) * (index / 4)),
);
const movingAveragePath = computed(() => {
  const movingAverage = values.value.map((_, index) => {
    const start = Math.max(0, index - 2);
    const slice = values.value.slice(start, index + 1);
    return slice.reduce((sum, value) => sum + value, 0) / slice.length;
  });

  return movingAverage
    .map((value, index) => `${index === 0 ? 'M' : 'L'} ${xScale(index)} ${yScale(value)}`)
    .join(' ');
});
const lastPoint = computed(() => points.value[points.value.length - 1]);
const markerX = computed(() => Math.min(lastPoint.value.x - 90, width - padR - 110));
const markerY = computed(() => Math.max(padT, lastPoint.value.y - 36));
</script>

<template>
  <article class="card line-card">
    <div class="section-head">
      <h2>Evolução do saldo</h2>
      <span class="meta">{{ data.monthShort }}</span>
    </div>

    <svg class="line-svg" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.28" />
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
        </linearGradient>
      </defs>

      <g v-for="tick in yTicks" :key="tick">
        <line
          :x1="padL"
          :x2="width - padR"
          :y1="yScale(tick)"
          :y2="yScale(tick)"
          stroke="var(--divider)"
          stroke-dasharray="2 4"
        />
        <text :x="padL - 8" :y="yScale(tick) + 3" font-size="9.5" text-anchor="end" fill="var(--text-3)">
          {{ formatAxisCurrency(tick) }}
        </text>
      </g>

      <text
        v-for="(point, index) in data.saldoMensal"
        :key="point.m"
        :x="xScale(index)"
        :y="height - padB + 16"
        font-size="9.5"
        text-anchor="middle"
        fill="var(--text-3)"
      >
        {{ point.m.split('/')[0] }}
      </text>

      <path :d="fillPath" fill="url(#lineGrad)" />
      <path
        :d="movingAveragePath"
        fill="none"
        stroke="var(--text-3)"
        stroke-width="1"
        stroke-dasharray="3 3"
        opacity="0.5"
      />
      <path :d="path" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round" />

      <circle
        v-for="(point, index) in points"
        :key="point.label"
        :cx="point.x"
        :cy="point.y"
        :r="index === points.length - 1 ? 4 : 2"
        :fill="index === points.length - 1 ? 'var(--accent-strong)' : 'var(--accent)'"
        stroke="var(--bg-elev)"
        :stroke-width="index === points.length - 1 ? 2 : 0"
      />

      <line
        :x1="lastPoint.x"
        :x2="lastPoint.x"
        :y1="padT"
        :y2="padT + innerH"
        stroke="var(--accent)"
        stroke-opacity="0.25"
        stroke-dasharray="2 3"
      />
      <g :transform="`translate(${markerX}, ${markerY})`">
        <rect x="0" y="0" width="104" height="30" rx="5" fill="var(--bg-elev-2)" stroke="var(--border-strong)" />
        <text x="8" y="13" font-size="9" fill="var(--text-3)" class="chart-label">
          {{ data.saldoMensal[data.saldoMensal.length - 1].m }}
        </text>
        <text x="8" y="25" font-size="11.5" fill="var(--text)" class="num">
          R$ {{ formatBRL(data.saldoMensal[data.saldoMensal.length - 1].v) }}
        </text>
      </g>
    </svg>

    <div class="line-legend">
      <span class="item"><span class="swatch main" /> Saldo de fechamento</span>
      <span class="item"><span class="swatch average" /> Média móvel (3m)</span>
    </div>
  </article>
</template>
