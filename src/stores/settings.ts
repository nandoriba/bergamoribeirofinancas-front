import { defineStore } from 'pinia';
import { ref } from 'vue';

import { memberApprovalsService, type MemberApproval } from '@/services/memberApprovals';
import { memberInvitesService, type MemberInvite, type MemberInvitePayload } from '@/services/memberInvites';

export const useSettingsStore = defineStore('settings', () => {
  const invites = ref<MemberInvite[]>([]);
  const approvals = ref<MemberApproval[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function refresh() {
    isLoading.value = true;
    error.value = null;
    try {
      const [nextInvites, nextApprovals] = await Promise.all([
        memberInvitesService.list(),
        memberApprovalsService.list(),
      ]);
      invites.value = nextInvites;
      approvals.value = nextApprovals;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao carregar configurações';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function createInvite(payload: MemberInvitePayload) {
    isLoading.value = true;
    error.value = null;
    try {
      const invite = await memberInvitesService.create(payload);
      invites.value = [invite, ...invites.value];
      return invite;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao criar convite';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function approve(id: string) {
    await memberApprovalsService.approve(id);
    await refresh();
  }

  async function reject(id: string) {
    await memberApprovalsService.reject(id);
    await refresh();
  }

  return { approvals, approve, createInvite, error, invites, isLoading, refresh, reject };
});
