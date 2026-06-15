import { apiFetch } from '@/lib/api';

export interface TelegramAuthCodeResponse {
  code: string;
  expiresAt: string;
  instruction: string;
}

export const telegramService = {
  createGroupCode() {
    return apiFetch<TelegramAuthCodeResponse>('/telegram/auth-codes/group', { method: 'POST' });
  },
  createMemberCode() {
    return apiFetch<TelegramAuthCodeResponse>('/telegram/auth-codes/member', { method: 'POST' });
  },
};
