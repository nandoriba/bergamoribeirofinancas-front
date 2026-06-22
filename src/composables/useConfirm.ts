import { computed, ref } from 'vue';

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  resolve: (value: boolean) => void;
}

const state = ref<ConfirmState | null>(null);

export function useConfirm() {
  function confirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      state.value = {
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        destructive: options.destructive ?? false,
        resolve,
      };
    });
  }

  function answer(value: boolean) {
    const current = state.value;
    if (!current) return;
    state.value = null;
    current.resolve(value);
  }

  return {
    confirm,
    request: computed(() => state.value),
    answer,
  };
}
