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
    path: '/categorias',
    name: 'categories',
    component: () => import('@/views/CategoriesView.vue'),
    meta: { title: 'Categorias' },
  },
  {
    path: '/faturas',
    name: 'invoices',
    component: () => import('@/views/InvoicesView.vue'),
    meta: { title: 'Faturas' },
  },
  {
    path: '/recorrentes',
    name: 'recurring',
    component: () => import('@/views/RecurringView.vue'),
    meta: { title: 'Recorrentes' },
  },
  {
    path: '/parcelamentos',
    name: 'installments',
    component: () => import('@/views/InstallmentsView.vue'),
    meta: { title: 'Parcelamentos' },
  },
  {
    path: '/relatorios',
    name: 'reports',
    component: () => import('@/views/ReportsView.vue'),
    meta: { title: 'Relatórios' },
  },
  {
    path: '/configuracoes',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: 'Configurações' },
  },
  {
    path: '/contas',
    name: 'accounts',
    component: () => import('@/views/AccountsView.vue'),
    meta: { title: 'Contas' },
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
