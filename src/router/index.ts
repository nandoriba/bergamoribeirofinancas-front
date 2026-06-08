import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Balanço' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true, title: 'Entrar' },
  },
  {
    path: '/lancamentos',
    name: 'transactions',
    component: () => import('@/views/TransactionsView.vue'),
    meta: { title: 'Lançamentos' },
  },
  {
    path: '/importar',
    name: 'imports',
    component: () => import('@/views/ImportView.vue'),
    meta: { title: 'Importar CSV' },
  },
  {
    path: '/:section(faturas|recorrentes|parcelamentos|categorias|contas|relatorios|configuracoes)',
    name: 'placeholder',
    component: () => import('@/views/PlaceholderView.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  await authStore.bootstrap();

  if (to.meta.public) {
    return authStore.isAuthenticated ? { name: 'dashboard' } : true;
  }

  if (!authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  return true;
});
