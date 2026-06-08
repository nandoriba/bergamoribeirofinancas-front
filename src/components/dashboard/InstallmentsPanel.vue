<script setup lang="ts">
import { computed } from 'vue';

import type { InstallmentItem } from '@/types/dashboard';
import { formatBRL } from '@/utils/format';

const props = defineProps<{
  items: InstallmentItem[];
}>();

const totalRestante = computed(() => props.items.reduce((sum, item) => sum + item.restante, 0));
const totalMensal = computed(() => props.items.reduce((sum, item) => sum + item.mensal, 0));
</script>

<template>
  <article class="card">
    <div class="section-head">
      <h2>Parcelas em aberto</h2>
      <span class="meta">{{ items.length }} ativos</span>
    </div>

    <div class="parcelas">
      <div v-for="item in items" :key="item.name" class="parcela">
        <div class="head">
          <span class="name">{{ item.name }}</span>
          <span class="num">{{ item.pago }}/{{ item.total }}</span>
        </div>

        <div class="bar">
          <span
            v-for="index in item.total"
            :key="index"
            :style="{
              width: `calc(${100 / item.total}% - 1.5px)`,
              marginRight: index < item.total ? '1.5px' : 0,
              background:
                index <= item.pago
                  ? 'var(--accent)'
                  : index === item.pago + 1
                    ? 'var(--accent-strong)'
                    : 'var(--bg-elev)',
            }"
          />
        </div>

        <div class="foot">
          <span>R$ {{ formatBRL(item.mensal) }} / mês</span>
          <span class="month">restam R$ {{ formatBRL(item.restante) }}</span>
        </div>
      </div>
      <div v-if="items.length === 0" class="empty-panel">
        Sem parcelamentos ativos
      </div>

      <div class="parcela-total">
        <span>Total comprometido</span>
        <strong>R$ {{ formatBRL(totalRestante) }}</strong>
      </div>
      <div class="parcela-total compact">
        <span>Impacto mensal</span>
        <strong>R$ {{ formatBRL(totalMensal) }}</strong>
      </div>
    </div>
  </article>
</template>
