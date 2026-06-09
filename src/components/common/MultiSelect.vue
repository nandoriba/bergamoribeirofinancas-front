<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import IconGlyph from '@/components/common/IconGlyph.vue';

const props = withDefaults(
  defineProps<{
    options: Array<{ label: string; value: string }>;
    allLabel?: string;
    emptyLabel?: string;
    searchPlaceholder?: string;
  }>(),
  {
    allLabel: 'Todos selecionados',
    emptyLabel: 'Nenhum selecionado',
    searchPlaceholder: 'Filtrar opções',
  },
);

const model = defineModel<string[]>({ required: true });
const open = ref(false);
const search = ref('');
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const menuStyle = ref<Record<string, string>>({});

const selectedSet = computed(() => new Set(model.value));
const selectedCount = computed(() => props.options.filter((option) => selectedSet.value.has(option.value)).length);
const allSelected = computed(() => props.options.length > 0 && selectedCount.value === props.options.length);
const visibleOptions = computed(() => {
  const term = normalize(search.value);
  if (!term) return props.options;
  return props.options.filter((option) => normalize(option.label).includes(term));
});
const triggerLabel = computed(() => {
  if (allSelected.value) return props.allLabel;
  if (selectedCount.value === 0) return props.emptyLabel;
  return `${selectedCount.value} selecionada(s)`;
});

function toggleOpen() {
  if (open.value) {
    open.value = false;
    return;
  }

  open.value = true;
  void nextTick(updateMenuPosition);
}

function selectAll() {
  model.value = props.options.map((option) => option.value);
}

function clearAll() {
  model.value = [];
}

function toggleOption(value: string) {
  const next = new Set(model.value);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  model.value = [...next];
}

function handlePointerDown(event: MouseEvent) {
  const target = event.target as Node;
  if (!root.value?.contains(target) && !menu.value?.contains(target)) {
    open.value = false;
  }
}

function handleViewportChange() {
  if (open.value) {
    updateMenuPosition();
  }
}

function updateMenuPosition() {
  const rect = trigger.value?.getBoundingClientRect();
  if (!rect) return;

  const viewportPadding = 16;
  const gap = 6;
  const desiredWidth = Math.max(rect.width, 320);
  const width = Math.min(desiredWidth, window.innerWidth - viewportPadding * 2, 380);
  const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding);
  const availableBelow = window.innerHeight - rect.bottom - viewportPadding - gap;
  const availableAbove = rect.top - viewportPadding - gap;
  const openUp = availableBelow < 260 && availableAbove > availableBelow;
  const maxHeight = Math.max(220, Math.min(openUp ? availableAbove : availableBelow, 360));

  menuStyle.value = {
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${maxHeight}px`,
    ...(openUp
      ? { bottom: `${window.innerHeight - rect.top + gap}px`, top: 'auto' }
      : { top: `${rect.bottom + gap}px`, bottom: 'auto' }),
  };
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

onMounted(() => {
  window.addEventListener('mousedown', handlePointerDown);
  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('scroll', handleViewportChange, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousedown', handlePointerDown);
  window.removeEventListener('resize', handleViewportChange);
  window.removeEventListener('scroll', handleViewportChange, true);
});
</script>

<template>
  <div ref="root" class="multi-select">
    <button
      ref="trigger"
      class="form-control multi-select-trigger"
      type="button"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggleOpen"
    >
      <span>{{ triggerLabel }}</span>
      <IconGlyph name="chevDown" :size="14" />
    </button>

    <Teleport to="body">
      <div v-if="open" ref="menu" class="multi-select-menu" :style="menuStyle">
        <input
          v-model="search"
          class="form-control multi-select-search"
          type="search"
          autocomplete="off"
          :placeholder="searchPlaceholder"
        >

        <div class="multi-select-actions">
          <button type="button" @click="selectAll">
            Marcar todas
          </button>
          <button type="button" @click="clearAll">
            Limpar
          </button>
        </div>

        <div class="multi-select-options" role="listbox" aria-multiselectable="true">
          <label v-for="option in visibleOptions" :key="option.value" class="multi-select-option">
            <input
              type="checkbox"
              :checked="selectedSet.has(option.value)"
              @change="toggleOption(option.value)"
            >
            <span>{{ option.label }}</span>
          </label>
          <p v-if="visibleOptions.length === 0" class="multi-select-empty">
            Nenhuma categoria encontrada.
          </p>
        </div>
      </div>
    </Teleport>
  </div>
</template>
