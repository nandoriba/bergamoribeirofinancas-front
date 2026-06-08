import { computed, ref } from 'vue';

type ToastKind = 'error' | 'info' | 'success';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}

const messages = ref<ToastMessage[]>([]);
let nextId = 1;

function push(message: string, kind: ToastKind = 'info') {
  const id = nextId;
  nextId += 1;
  messages.value = [...messages.value, { id, kind, message }];
  window.setTimeout(() => dismiss(id), 4200);
}

function dismiss(id: number) {
  messages.value = messages.value.filter((message) => message.id !== id);
}

export function useToast() {
  return {
    messages: computed(() => messages.value),
    dismiss,
    error: (message: string) => push(message, 'error'),
    info: (message: string) => push(message, 'info'),
    success: (message: string) => push(message, 'success'),
  };
}
