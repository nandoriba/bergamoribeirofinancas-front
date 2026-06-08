import { apiFetch } from '@/lib/api';

type QueryValue = boolean | number | string | null | undefined;

export interface CrudService<TItem, TCreate, TUpdate = Partial<TCreate>> {
  list: (query?: Record<string, QueryValue>) => Promise<TItem[]>;
  create: (payload: TCreate) => Promise<TItem>;
  update: (id: string, payload: TUpdate) => Promise<TItem>;
  remove: (id: string) => Promise<void>;
}

export function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function createCrudService<TItem, TCreate, TUpdate = Partial<TCreate>>(basePath: string): CrudService<TItem, TCreate, TUpdate> {
  return {
    list: (query) => apiFetch<TItem[]>(`${basePath}${buildQuery(query)}`),
    create: (payload) => apiFetch<TItem>(basePath, { method: 'POST', body: payload as Record<string, unknown> }),
    update: (id, payload) => apiFetch<TItem>(`${basePath}/${id}`, { method: 'PATCH', body: payload as Record<string, unknown> }),
    remove: (id) => apiFetch<void>(`${basePath}/${id}`, { method: 'DELETE' }),
  };
}
