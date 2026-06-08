<script setup lang="ts">
import type { TransactionItem } from '@/types/dashboard';
import { formatCurrency } from '@/utils/format';

defineProps<{
  items: TransactionItem[];
}>();

const statusLabel: Record<TransactionItem['status'], string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  duplicate: 'Duplicado',
};
</script>

<template>
  <section class="data-surface">
    <div class="section-head">
      <h2>Lançamentos recentes</h2>
      <span class="meta">{{ items.length }} itens</span>
    </div>

    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Conta</th>
            <th>Categoria</th>
            <th>Perfil</th>
            <th>Status</th>
            <th class="num-col">
              Valor
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td class="num">
              {{ item.date }}
            </td>
            <td class="strong">
              {{ item.description }}
            </td>
            <td>{{ item.account }}</td>
            <td>{{ item.category }}</td>
            <td>{{ item.profile }}</td>
            <td>
              <span class="status-badge" :class="item.status">{{ statusLabel[item.status] }}</span>
            </td>
            <td class="num num-col" :class="item.type">
              {{ item.type === 'expense' ? '-' : '+' }}{{ formatCurrency(item.value) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

