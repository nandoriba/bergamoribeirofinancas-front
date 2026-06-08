<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import Sidebar from '@/components/layout/Sidebar.vue';
import Topbar from '@/components/layout/Topbar.vue';

const route = useRoute();
const sidebarOpen = ref(false);

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false;
  },
);
</script>

<template>
  <div class="app">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <button
      v-if="sidebarOpen"
      class="sidebar-backdrop"
      type="button"
      aria-label="Fechar navegação"
      @click="sidebarOpen = false"
    />

    <main class="main">
      <Topbar @open-menu="sidebarOpen = true" />
      <div class="content">
        <slot />
      </div>
    </main>
  </div>
</template>

