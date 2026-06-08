<script setup lang="ts">
import { computed } from 'vue';

import type { DashboardData } from '@/types/dashboard';
import { formatBRL } from '@/utils/format';

import IconGlyph from '@/components/common/IconGlyph.vue';

const props = defineProps<{
  data: DashboardData;
}>();

const maxValue = computed(() => Math.max(...props.data.top5.map((category) => category.value), 1));
const categoryIcons: Record<string, string> = {
  Supermercado: 'cart',
  Moradia: 'home',
  Educação: 'book',
  Combustível: 'fuel',
  Saúde: 'health',
};
</script>

<template>
  <article class="card">
    <div class="section-head">
      <h2>Top categorias do mês</h2>
      <span class="meta">por gasto</span>
    </div>

    <div class="top5">
      <div v-for="category in data.top5" :key="category.name" class="top5-item">
        <div class="top5-head">
          <IconGlyph :name="categoryIcons[category.name] || 'tag'" :size="15" />
          <span class="name">{{ category.name }}</span>
          <span class="val">R$ {{ formatBRL(category.value) }}</span>
        </div>
        <div class="bar-row">
          <span :style="{ width: `${(category.value / maxValue) * 100}%`, background: category.color }" />
        </div>
      </div>
      <div v-if="data.top5.length === 0" class="empty-panel">
        Sem despesas categorizadas
      </div>
    </div>
  </article>
</template>
