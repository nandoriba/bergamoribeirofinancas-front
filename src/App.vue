<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import Toast from '@/components/common/Toast.vue';
</script>

<template>
  <RouterView />
  <Toast />
  <ConfirmDialog />
</template>
