<script setup lang="ts" generic="TItem extends { id?: unknown }">
defineProps<{
  columns: Array<{ key: keyof TItem | string; label: string; align?: 'left' | 'right'; class?: string }>;
  items: TItem[];
  emptyLabel?: string;
}>();

function rowKey(item: TItem) {
  return String(item.id ?? JSON.stringify(item));
}

function cellValue(item: TItem, key: keyof TItem | string) {
  return (item as Record<string, unknown>)[String(key)];
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
          >
            {{ column.label }}
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
