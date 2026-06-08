<script setup lang="ts">
import type { AlertItem } from '@/types/dashboard';

import IconGlyph from '@/components/common/IconGlyph.vue';

defineProps<{
  items: AlertItem[];
}>();

const iconMap: Record<AlertItem['icon'], string> = {
  card: 'card',
  repeat: 'repeat',
  split: 'split',
};
</script>

<template>
  <article class="card">
    <div class="section-head">
      <h2>Avisos & próximos passos</h2>
      <span class="meta">{{ items.length }} itens</span>
    </div>

    <div class="avisos">
      <div v-for="item in items" :key="item.title" class="aviso" :class="item.kind">
        <div class="ic">
          <IconGlyph :name="iconMap[item.icon]" :size="14" />
        </div>
        <div>
          <div class="title">
            {{ item.title }}
          </div>
          <div class="sub">
            {{ item.sub }}
          </div>
        </div>
        <div class="due">
          <span class="amount num">{{ item.due }}</span>
          <span>{{ item.cta }}</span>
        </div>
      </div>
      <div v-if="items.length === 0" class="empty-panel">
        Sem avisos para o mês
      </div>
    </div>
  </article>
</template>
