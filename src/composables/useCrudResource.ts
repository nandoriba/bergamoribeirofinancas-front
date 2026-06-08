import { ref, type Ref } from 'vue';

import type { CrudService } from '@/services/_base';

export interface CrudResourceOptions<TItem, TCreate, TUpdate> {
  service: CrudService<TItem, TCreate, TUpdate>;
  onAfterMutate?: () => void | Promise<void>;
}

export interface CrudResource<TItem, TCreate, TUpdate> {
  items: Ref<TItem[]>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  refresh: (query?: Record<string, boolean | number | string | null | undefined>) => Promise<void>;
  create: (payload: TCreate) => Promise<TItem>;
  update: (id: string, payload: TUpdate) => Promise<TItem>;
  remove: (id: string) => Promise<void>;
  clearError: () => void;
}

export function useCrudResource<TItem, TCreate, TUpdate = Partial<TCreate>>(
  options: CrudResourceOptions<TItem, TCreate, TUpdate>,
): CrudResource<TItem, TCreate, TUpdate> {
  const items = ref<TItem[]>([]) as Ref<TItem[]>;
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function refresh(query?: Record<string, boolean | number | string | null | undefined>) {
    isLoading.value = true;
    error.value = null;
    try {
      items.value = await options.service.list(query);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao carregar dados';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function mutate<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await operation();
      await options.onAfterMutate?.();
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao salvar dados';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    items,
    isLoading,
    error,
    clearError: () => {
      error.value = null;
    },
    refresh,
    create: (payload) => mutate(() => options.service.create(payload)),
    update: (id, payload) => mutate(() => options.service.update(id, payload)),
    remove: (id) => mutate(() => options.service.remove(id)),
  };
}
