<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import IconGlyph from '@/components/common/IconGlyph.vue';
import AppShell from '@/components/layout/AppShell.vue';

const route = useRoute();

const sectionMap: Record<string, { title: string; icon: string; actions: string[] }> = {
  faturas: { title: 'Faturas', icon: 'receipt', actions: ['Importar fatura', 'Fechar mês'] },
  recorrentes: { title: 'Recorrentes', icon: 'repeat', actions: ['Nova recorrência', 'Gerar mês'] },
  parcelamentos: { title: 'Parcelamentos', icon: 'split', actions: ['Novo parcelamento', 'Projetar parcelas'] },
  categorias: { title: 'Categorias', icon: 'tag', actions: ['Nova categoria', 'Revisar aliases'] },
  contas: { title: 'Contas', icon: 'wallet', actions: ['Nova conta', 'Conciliar saldo'] },
  relatorios: { title: 'Relatórios', icon: 'bar', actions: ['Exportar CSV', 'Comparar perfis'] },
  configuracoes: { title: 'Configurações', icon: 'settings', actions: ['Gerar convite', 'Preferências'] },
};

const section = computed(() => {
  const key = String(route.params.section ?? '');
  return sectionMap[key] ?? sectionMap.relatorios;
});
</script>

<template>
  <AppShell>
    <section class="module-board">
      <div class="module-panel">
        <div class="module-icon">
          <IconGlyph :name="section.icon" :size="24" />
        </div>
        <div>
          <h2>{{ section.title }}</h2>
          <p>Fluxo reservado para a próxima etapa de integração com API e regras financeiras.</p>
        </div>
        <div class="module-actions">
          <button v-for="action in section.actions" :key="action" class="quiet-btn" type="button">
            {{ action }}
          </button>
        </div>
      </div>
    </section>
  </AppShell>
</template>

