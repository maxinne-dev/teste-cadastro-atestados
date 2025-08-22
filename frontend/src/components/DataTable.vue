<template>
  <div class="data-table">
    <div class="header"><slot name="header" /></div>
    <table v-if="rows.length">
      <thead><slot name="columns" /></thead>
      <tbody>
        <slot name="row" v-for="(r, i) in pagedRows" :row="r" :index="i" :key="i" />
      </tbody>
    </table>
    <div v-else class="empty">
      <slot name="empty">{{ emptyMessage }}</slot>
    </div>
    <div class="footer"><slot name="footer" /></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{ rows: any[]; loading?: boolean; emptyMessage?: string; total?: number; page?: number; rowsPerPage?: number }>(), {
  rows: () => [],
  emptyMessage: 'No data',
  page: 1,
  rowsPerPage: 10,
})
defineEmits<{ (e: 'update:page', v: number): void; (e: 'update:rowsPerPage', v: number): void; (e: 'sort', payload: any): void }>()
const pagedRows = computed(() => {
  const start = (props.page - 1) * props.rowsPerPage
  return props.rows.slice(start, start + props.rowsPerPage)
})
</script>

<style scoped>
.data-table { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
table { width: 100%; border-collapse: collapse; }
thead th { text-align: left; color: var(--color-text-secondary); font-weight: var(--font-weight-medium); padding: 8px 12px; border-bottom: 1px solid var(--color-border); }
tbody td { padding: 10px 12px; border-top: 1px solid var(--color-border); }
.empty { padding: var(--space-6); color: var(--color-text-secondary); text-align: center; }
.header, .footer { padding: var(--space-3) var(--space-4); }
</style>

