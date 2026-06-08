<script setup lang="ts">
import { computed } from 'vue';

import Sparkline from '@/components/dashboard/Sparkline.vue';
import { clamp } from '@/utils/chart';
import { formatBRL } from '@/utils/format';

const props = withDefaults(
  defineProps<{
    label: string;
    value: number;
    spark: number[];
    sub: string;
    periodLabel: string;
    variant?: 'balance' | 'metric';
    tag?: string;
    progressPct?: number | null;
    deltaPct?: number | null;
    deltaDir?: 'up' | 'down';
    accentColor?: string;
  }>(),
  {
    variant: 'metric',
    tag: undefined,
    progressPct: null,
    deltaPct: null,
    deltaDir: 'up',
    accentColor: 'var(--accent)',
  },
);

const isBalance = computed(() => props.variant === 'balance');
const isPositive = computed(() => props.value >= 0);
const progressWidth = computed(() => `${Math.round(clamp(props.progressPct ?? 0) * 100)}%`);
</script>

<template>
  <article v-if="isBalance" class="saldo-card" :class="isPositive ? 'pos' : 'neg'">
    <div class="card-title ct">
      <span>{{ label }}</span>
    </div>
    <div class="value num">
      <span class="cur">R$</span>
      <span>{{ formatBRL(Math.abs(value)) }}</span>
    </div>
    <Sparkline :data="spark" stroke="#fff" :stroke-opacity="0.88" fill="rgba(255,255,255,0.08)" />
    <div class="footnote">
      <span>{{ sub }}</span>
      <span>{{ periodLabel }}</span>
    </div>
    <div v-if="progressPct !== null" class="progress" :aria-label="progressWidth">
      <span :style="{ width: progressWidth }" />
    </div>
  </article>

  <article v-else class="card exp-card">
    <div class="card-title">
      <span>{{ label }}</span>
      <span v-if="tag" class="tag">{{ tag }}</span>
    </div>
    <div class="value">
      <span class="cur">R$</span>
      <span class="num">{{ formatBRL(value) }}</span>
    </div>
    <Sparkline
      :data="spark"
      :stroke="accentColor"
      :stroke-opacity="0.95"
      :stroke-width="1.6"
      :height="28"
    />
    <div class="footnote">
      <span>{{ sub }}</span>
      <span class="row">
        <span v-if="deltaPct !== null" class="delta" :class="deltaDir">
          {{ deltaDir === 'up' ? '▲' : '▼' }} {{ Math.abs(deltaPct) }}%
        </span>
        <span class="muted">{{ periodLabel }}</span>
      </span>
    </div>
  </article>
</template>

