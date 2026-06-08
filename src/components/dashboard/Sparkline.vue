<script setup lang="ts">
import { computed } from 'vue';

import { buildSmoothPath } from '@/utils/chart';

const props = withDefaults(
  defineProps<{
    data: number[];
    height?: number;
    stroke?: string;
    strokeOpacity?: number;
    fill?: string | null;
    strokeWidth?: number;
  }>(),
  {
    height: 38,
    stroke: '#fff',
    strokeOpacity: 0.85,
    fill: null,
    strokeWidth: 1.5,
  },
);

const width = 100;

const path = computed(() => {
  if (props.data.length < 2) {
    return `M 0 ${props.height / 2} L ${width} ${props.height / 2}`;
  }

  const min = Math.min(...props.data);
  const max = Math.max(...props.data);
  const range = max - min || 1;
  const stepX = width / (props.data.length - 1);

  const points = props.data.map((value, index) => ({
    x: index * stepX,
    y: props.height - 4 - ((value - min) / range) * (props.height - 8),
  }));

  return buildSmoothPath(points);
});

const fillPath = computed(() => `${path.value} L ${width} ${props.height} L 0 ${props.height} Z`);
</script>

<template>
  <svg class="spark" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none">
    <path v-if="fill" :d="fillPath" :fill="fill" />
    <path
      :d="path"
      fill="none"
      :stroke="stroke"
      :stroke-opacity="strokeOpacity"
      :stroke-width="strokeWidth"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
</template>
