import { createCrudService } from './_base';
import type { Category, CategoryType } from '@/types/api';

export interface CategoryPayload {
  name: string;
  type: CategoryType;
  color: string;
  aliases?: string[];
}

export const categoriesService = createCrudService<Category, CategoryPayload>('/categories');
