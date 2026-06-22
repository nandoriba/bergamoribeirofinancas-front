import { apiFetch } from '@/lib/api';
import type { ProfileSummary } from '@/types/api';

export const profilesService = {
  list: () => apiFetch<ProfileSummary[]>('/profiles'),
};
