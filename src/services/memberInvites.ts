import { apiFetch } from '@/lib/api';

export interface MemberInvite {
  id: string;
  token: string;
  email?: string | null;
  status: 'active' | 'used' | 'expired' | 'revoked';
  expiresAt: string;
  createdAt?: string;
  link?: string;
}

export interface MemberInvitePayload {
  email?: string;
  expiresInDays?: number;
}

export const memberInvitesService = {
  list() {
    return apiFetch<MemberInvite[]>('/member-invites');
  },
  create(payload: MemberInvitePayload) {
    return apiFetch<MemberInvite>('/member-invites', { method: 'POST', body: payload as Record<string, unknown> });
  },
};
