<template>
  <div class="data-table">
    <div class="header"><slot name="header" /></div>
    <table v-if="rows.length">
      <thead @click="onHeaderClick"><slot name="columns" /></thead>
      <tbody>
        <slot name="row" v-for="(r, i) in pagedRows" :row="r" :index="i" :key="i" />
      </tbody>
    </table>
    <div v-else class="empty">
      <slot name="empty">{{ emptyMessage }}</slot>
    </div>
    <div class="footer">
      <slot name="footer" />
      <div v-if="showPagination" class="pagination">
        <button class="btn" :disabled="page <= 1" @click="prev">Anterior</button>
        <span>Página {{ page }} de {{ totalPages }}</span>
        <button class="btn" :disabled="page >= totalPages" @click="next">Próxima</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(defineProps<{ rows: any[]; loading?: boolean; emptyMessage?: string; total?: number; page?: number; rowsPerPage?: number; sortBy?: string | null; sortDir?: 'asc' | 'desc' | null }>(), {
  rows: () => [],
  emptyMessage: 'No data',
  page: 1,
  rowsPerPage: 10,
  sortBy: null,
  sortDir: null,
})
const emit = defineEmits<{ (e: 'update:page', v: number): void; (e: 'update:rowsPerPage', v: number): void; (e: 'sort', payload: { sortBy: string | null; sortDir: 'asc' | 'desc' | null }): void; (e: 'update:sortBy', v: string | null): void; (e: 'update:sortDir', v: 'asc' | 'desc' | null): void }>()

function getByPath(obj: any, path: string) {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj)
}

const sortedRows = computed(() => {
  const arr = [...props.rows]
  if (!props.sortBy || !props.sortDir) return arr
  const dir = props.sortDir === 'asc' ? 1 : -1
  return arr.sort((a, b) => {
    const va = getByPath(a, props.sortBy!)
    const vb = getByPath(b, props.sortBy!)
    if (va == null && vb == null) return 0
    if (va == null) return -1 * dir
    if (vb == null) return 1 * dir
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb)) * dir
  })
})

const pagedRows = computed(() => {
  const start = (props.page - 1) * props.rowsPerPage
  return sortedRows.value.slice(start, start + props.rowsPerPage)
})
const totalItems = computed(() => props.total ?? props.rows.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / props.rowsPerPage)))
const page = computed(() => Math.min(props.page, totalPages.value))
const showPagination = computed(() => totalItems.value > props.rowsPerPage)
function prev() { if (page.value > 1) emit('update:page', page.value - 1) }
function next() { if (page.value < totalPages.value) emit('update:page', page.value + 1) }

function onHeaderClick(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest('[data-sort]') as HTMLElement | null
  if (!target) return
  const key = target.getAttribute('data-sort')
  if (!key) return
  let nextDir: 'asc' | 'desc' = 'asc'
  if (props.sortBy === key) nextDir = props.sortDir === 'asc' ? 'desc' : 'asc'
  emit('update:sortBy', key)
  emit('update:sortDir', nextDir)
  emit('sort', { sortBy: key, sortDir: nextDir })
}
</script>

<style scoped>
.data-table { background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
table { width: 100%; border-collapse: collapse; }
thead th { text-align: left; color: var(--color-text-secondary); font-weight: var(--font-weight-medium); padding: 8px 12px; border-bottom: 1px solid var(--color-border); }
thead [data-sort] { cursor: pointer; }
tbody td { padding: 10px 12px; border-top: 1px solid var(--color-border); }
.empty { padding: var(--space-6); color: var(--color-text-secondary); text-align: center; }
.header, .footer { padding: var(--space-3) var(--space-4); display: flex; align-items: center; justify-content: space-between; }
.pagination { display: inline-flex; align-items: center; gap: var(--space-3); }
.btn { padding: 6px 10px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
