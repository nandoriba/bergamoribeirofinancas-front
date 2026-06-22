import { defineStore } from 'pinia';

import { useCrudResource } from '@/composables/useCrudResource';
import { categoriesService, type CategoryPayload } from '@/services/categories';
import type { Category } from '@/types/api';

export const useCategoriesStore = defineStore('categories', () => {
  const resource = useCrudResource<Category, CategoryPayload>({ service: categoriesService });
  return resource;
});
