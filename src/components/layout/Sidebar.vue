<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { computed } from 'vue';

import IconGlyph from '@/components/common/IconGlyph.vue';
import { useAuthStore } from '@/stores/auth';
import { useDashboardStore } from '@/stores/dashboard';

defineProps<{
  open: boolean;
}>();

defineEmits<{
  close: [];
}>();

const route = useRoute();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();

const navGroups = computed(() => [
  {
    label: 'Geral',
    items: [
      { id: 'dash', name: 'Balanço', icon: 'dashboard', to: '/', badge: undefined },
      {
        id: 'lanc',
        name: 'Lançamentos',
        icon: 'list',
        to: '/lancamentos',
        badge: dashboardStore.data.transactions.length ? String(dashboardStore.data.transactions.length) : undefined,
      },
      { id: 'import', name: 'Importar CSV', icon: 'upload', to: '/importar', badge: undefined },
    ],
  },
  {
    label: 'Cartão & recorrências',
    items: [
      { id: 'fatura', name: 'Faturas', icon: 'receipt', to: '/faturas', badge: undefined },
      { id: 'rec', name: 'Recorrentes', icon: 'repeat', to: '/recorrentes', badge: undefined },
      {
        id: 'parc',
        name: 'Parcelamentos',
        icon: 'split',
        to: '/parcelamentos',
        badge: dashboardStore.data.parcelas.length ? String(dashboardStore.data.parcelas.length) : undefined,
      },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { id: 'cat', name: 'Categorias', icon: 'tag', to: '/categorias', badge: undefined },
      { id: 'cta', name: 'Contas', icon: 'wallet', to: '/contas', badge: undefined },
    ],
  },
  {
    label: 'Análise',
    items: [{ id: 'rel', name: 'Relatórios', icon: 'bar', to: '/relatorios', badge: undefined }],
  },
]);

const initials = computed(() => {
  const name = authStore.user?.name ?? 'Usuário';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
});

function isActive(path: string) {
  return route.path === path;
}
</script>

<template>
  <aside class="sidebar" :class="{ open }" aria-label="Navegação principal">
    <div class="mobile-sidebar-head">
      <span>Menu</span>
      <button type="button" class="icon-btn" aria-label="Fechar navegação" @click="$emit('close')">
        <IconGlyph name="close" :size="16" />
      </button>
    </div>

    <RouterLink class="brand" to="/" @click="$emit('close')">
      <div class="brand-mark">
        R
      </div>
      <div class="brand-name">
        <span class="name">Ribeiro</span>
        <span class="sub">Finanças</span>
      </div>
    </RouterLink>

    <nav v-for="group in navGroups" :key="group.label" class="nav-group" :aria-label="group.label">
      <div class="nav-label">
        {{ group.label }}
      </div>
      <RouterLink
        v-for="item in group.items"
        :key="item.id"
        class="nav-item"
        :class="{ active: isActive(item.to) }"
        :to="item.to"
        @click="$emit('close')"
      >
        <IconGlyph :name="item.icon" />
        <span>{{ item.name }}</span>
        <span v-if="item.badge" class="badge num">{{ item.badge }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <RouterLink class="nav-item" to="/configuracoes" @click="$emit('close')">
        <IconGlyph name="settings" />
        <span>Configurações</span>
      </RouterLink>

      <div class="users">
        <div class="avatars" aria-hidden="true">
          <div class="avatar f">
            {{ initials }}
          </div>
        </div>
        <div class="meta">
          <span class="name">{{ authStore.user?.name ?? 'Usuário' }}</span>
          <span class="sub">{{ authStore.user?.familyName ?? 'Casa Ribeiro' }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>
