import { apiFetch } from '@/lib/api';

export interface MemberApproval {
  id: string;
  requestedName: string;
  requestedEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string | null;
  createdAt: string;
}

export const memberApprovalsService = {
  list() {
    return apiFetch<MemberApproval[]>('/member-approvals');
  },
  approve(id: string) {
    return apiFetch<MemberApproval>(`/member-approvals/${id}/approve`, { method: 'POST' });
  },
  reject(id: string) {
    return apiFetch<MemberApproval>(`/member-approvals/${id}/reject`, { method: 'POST' });
  },
};
