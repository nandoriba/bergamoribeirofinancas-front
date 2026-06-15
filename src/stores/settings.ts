import { defineStore } from 'pinia';
import { ref } from 'vue';

import { memberApprovalsService, type MemberApproval } from '@/services/memberApprovals';
import { memberInvitesService, type MemberInvite, type MemberInvitePayload } from '@/services/memberInvites';
import { telegramService, type TelegramAuthCodeResponse } from '@/services/telegram';

export const useSettingsStore = defineStore('settings', () => {
  const invites = ref<MemberInvite[]>([]);
  const approvals = ref<MemberApproval[]>([]);
  const telegramGroupCode = ref<TelegramAuthCodeResponse | null>(null);
  const telegramMemberCode = ref<TelegramAuthCodeResponse | null>(null);
  const isLoading = ref(false);
  const isTelegramLoading = ref(false);
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

  async function createTelegramGroupCode() {
    isTelegramLoading.value = true;
    error.value = null;
    try {
      telegramGroupCode.value = await telegramService.createGroupCode();
      return telegramGroupCode.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao gerar código do grupo';
      throw err;
    } finally {
      isTelegramLoading.value = false;
    }
  }

  async function createTelegramMemberCode() {
    isTelegramLoading.value = true;
    error.value = null;
    try {
      telegramMemberCode.value = await telegramService.createMemberCode();
      return telegramMemberCode.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Falha ao gerar código de vínculo';
      throw err;
    } finally {
      isTelegramLoading.value = false;
    }
  }

  return {
    approvals,
    approve,
    createInvite,
    createTelegramGroupCode,
    createTelegramMemberCode,
    error,
    invites,
    isLoading,
    isTelegramLoading,
    refresh,
    reject,
    telegramGroupCode,
    telegramMemberCode,
  };
});
