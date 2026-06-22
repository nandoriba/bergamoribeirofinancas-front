<script setup lang="ts" generic="TItem extends { id?: unknown }">
import IconGlyph from '@/components/common/IconGlyph.vue';

const props = defineProps<{
  columns: Array<{ key: keyof TItem | string; label: string; align?: 'left' | 'right'; class?: string; sortable?: boolean }>;
  items: TItem[];
  emptyLabel?: string;
  sortKey?: keyof TItem | string | null;
  sortDirection?: 'asc' | 'desc';
}>();

const emit = defineEmits<{
  sortChange: [key: string];
}>();

function rowKey(item: TItem) {
  return String(item.id ?? JSON.stringify(item));
}

function cellValue(item: TItem, key: keyof TItem | string) {
  return (item as Record<string, unknown>)[String(key)];
}

function isSorted(columnKey: keyof TItem | string) {
  return props.sortKey !== null && props.sortKey !== undefined && String(props.sortKey) === String(columnKey);
}

function sortLabel(column: { key: keyof TItem | string; label: string }) {
  if (!isSorted(column.key)) return `Ordenar por ${column.label}`;
  return props.sortDirection === 'asc'
    ? `Ordenado por ${column.label} crescente. Inverter ordem`
    : `Ordenado por ${column.label} decrescente. Inverter ordem`;
}
</script>

<template>
  <div class="table-scroll">
    <table class="data-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="String(column.key)"
            :class="[{ 'num-col': column.align === 'right' }, column.class]"
            :aria-sort="column.sortable && isSorted(column.key) ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined"
          >
            <button
              v-if="column.sortable"
              class="table-sort-btn"
              type="button"
              :aria-label="sortLabel(column)"
              @click="emit('sortChange', String(column.key))"
            >
              <span>{{ column.label }}</span>
              <IconGlyph
                :name="isSorted(column.key) && sortDirection === 'asc' ? 'chevUp' : 'chevDown'"
                :size="13"
              />
            </button>
            <span v-else>{{ column.label }}</span>
          </th>
          <th v-if="$slots.actions" class="actions-col">
            Ações
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="items.length === 0">
          <td class="empty-cell" :colspan="columns.length + ($slots.actions ? 1 : 0)">
            {{ emptyLabel ?? 'Nenhum registro encontrado' }}
          </td>
        </tr>
        <tr v-for="item in items" v-else :key="rowKey(item)">
          <td
            v-for="column in columns"
            :key="String(column.key)"
            :class="[{ 'num-col': column.align === 'right' }, column.class]"
          >
            <slot :name="`cell-${String(column.key)}`" :item="item" :value="cellValue(item, column.key)">
              {{ cellValue(item, column.key) }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="actions-col">
            <slot name="actions" :item="item" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
