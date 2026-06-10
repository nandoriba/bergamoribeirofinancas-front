<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import IconGlyph from '@/components/common/IconGlyph.vue';
import type { InstallmentItem } from '@/types/dashboard';
import { formatBRL } from '@/utils/format';

const PAGE_SIZE = 5;

const props = defineProps<{
  items: InstallmentItem[];
}>();

const currentPage = ref(0);
const pageCount = computed(() => Math.max(Math.ceil(props.items.length / PAGE_SIZE), 1));
const visibleItems = computed(() => {
  const start = currentPage.value * PAGE_SIZE;
  return props.items.slice(start, start + PAGE_SIZE);
});
const totalRestante = computed(() => props.items.reduce((sum, item) => sum + item.restante, 0));
const totalMensal = computed(() => props.items.reduce((sum, item) => sum + item.mensal, 0));
const hasPages = computed(() => pageCount.value > 1);

watch(
  () => props.items.map((item) => item.id).join('|'),
  () => {
    currentPage.value = 0;
  },
);

function previousPage() {
  currentPage.value = currentPage.value === 0 ? pageCount.value - 1 : currentPage.value - 1;
}

function nextPage() {
  currentPage.value = currentPage.value === pageCount.value - 1 ? 0 : currentPage.value + 1;
}
</script>

<template>
  <article class="card">
    <div class="section-head">
      <h2>Parcelas em aberto</h2>
      <span class="meta">{{ items.length }} ativos</span>
    </div>

    <div class="parcelas">
      <div v-for="item in visibleItems" :key="item.id" class="parcela">
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

      <div v-if="hasPages" class="installment-carousel-nav" aria-label="Navegação de parcelas">
        <button class="icon-btn installment-nav-btn" type="button" title="Página anterior" aria-label="Página anterior" @click="previousPage">
          <IconGlyph name="chevL" :size="14" />
        </button>
        <div class="installment-page-dots" role="tablist" aria-label="Páginas de parcelas">
          <button
            v-for="page in pageCount"
            :key="page"
            class="installment-page-dot"
            :class="{ active: page - 1 === currentPage }"
            type="button"
            :aria-label="`Página ${page} de ${pageCount}`"
            :aria-selected="page - 1 === currentPage"
            role="tab"
            @click="currentPage = page - 1"
          />
        </div>
        <button class="icon-btn installment-nav-btn" type="button" title="Próxima página" aria-label="Próxima página" @click="nextPage">
          <IconGlyph name="chevR" :size="14" />
        </button>
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
