<template>
  <div class="data-table">
    <div class="header">
      <slot name="header" />
    </div>
    <div v-if="rows.length && isCardView && hasCard" class="cards" role="list">
      <div v-for="(r, i) in pagedRows" :key="i" class="card" role="listitem">
        <slot name="card" :row="r" :index="i" />
      </div>
    </div>
    <div v-else-if="rows.length || loading" class="table-scroll">
      <table :aria-label="ariaLabel">
        <thead ref="thead" @click="onHeaderClick" @keydown="onHeaderKeydown">
          <slot name="columns" />
        </thead>
        <tbody>
          <template v-if="!loading">
            <slot
              v-for="(r, i) in pagedRows"
              :key="i"
              name="row"
              :row="r"
              :index="i"
            />
          </template>
          <template v-else>
            <tr v-for="i in Math.max(3, rowsPerPage)" :key="i">
              <td :colspan="999">
                <SkeletonLoader :lines="1" height="14px" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <div v-else class="empty">
      <slot name="empty">
        {{ emptyMessage }}
      </slot>
    </div>
    <div class="footer">
      <slot name="footer" />
      <div v-if="showPagination" class="pagination">
        <label class="page-size">
          Itens por página
          <select :value="props.rowsPerPage" @change="onPageSizeChange">
            <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
        </label>
        <div class="pager">
          <button class="btn" :disabled="page <= 1 || loading" @click="prev">
            Anterior
          </button>
          <span>Página {{ page }} de {{ totalPages }}</span>
          <button class="btn" :disabled="page >= totalPages || loading" @click="next">
            Próxima
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useSlots, watch } from 'vue'
import SkeletonLoader from './SkeletonLoader.vue'
const props = withDefaults(
  defineProps<{
    rows: any[]
    loading?: boolean
    emptyMessage?: string
    total?: number
    page?: number
    rowsPerPage?: number
    sortBy?: string | null
    sortDir?: 'asc' | 'desc' | null
    ariaLabel?: string
    cardBreakpoint?: number
    remotePaging?: boolean
    pageSizeOptions?: number[]
  }>(),
  {
    rows: () => [],
    emptyMessage: 'No data',
    page: 1,
    rowsPerPage: 10,
    sortBy: null,
    sortDir: null,
    cardBreakpoint: 640,
    remotePaging: false,
    pageSizeOptions: () => [5, 10, 20, 50],
  },
)
const emit = defineEmits<{
  (e: 'update:page', v: number): void
  (e: 'update:rowsPerPage', v: number): void
  (
    e: 'sort',
    payload: { sortBy: string | null; sortDir: 'asc' | 'desc' | null },
  ): void
  (e: 'update:sortBy', v: string | null): void
  (e: 'update:sortDir', v: 'asc' | 'desc' | null): void
}>()

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
  if (props.remotePaging) return sortedRows.value
  const start = (props.page - 1) * props.rowsPerPage
  return sortedRows.value.slice(start, start + props.rowsPerPage)
})
const totalItems = computed(() => props.total ?? props.rows.length)
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalItems.value / props.rowsPerPage)),
)
const page = computed(() => Math.min(props.page, totalPages.value))
const showPagination = computed(() => totalItems.value > props.rowsPerPage)
function prev() {
  if (page.value > 1) emit('update:page', page.value - 1)
}
function next() {
  if (page.value < totalPages.value) emit('update:page', page.value + 1)
}
const pageSizeOptions = computed(() => props.pageSizeOptions || [])
function onPageSizeChange(e: Event) {
  const val = parseInt((e.target as HTMLSelectElement).value, 10)
  emit('update:rowsPerPage', isNaN(val) ? props.rowsPerPage : val)
}

function onHeaderClick(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest(
    '[data-sort]',
  ) as HTMLElement | null
  if (!target) return
  const key = target.getAttribute('data-sort')
  if (!key) return
  let nextDir: 'asc' | 'desc' = 'asc'
  if (props.sortBy === key) nextDir = props.sortDir === 'asc' ? 'desc' : 'asc'
  emit('update:sortBy', key)
  emit('update:sortDir', nextDir)
  emit('sort', { sortBy: key, sortDir: nextDir })
}

// Responsive card mode detection
const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
function onResize() {
  width.value = window.innerWidth
}
onMounted(() => {
  window.addEventListener('resize', onResize, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
const isCardView = computed(() => width.value < (props.cardBreakpoint || 0))
const slots = useSlots()
const hasCard = computed(() => Boolean(slots.card))

// A11y: manage aria-sort on sortable headers
const thead = ref<HTMLElement | null>(null)
function ensureSortIcon(
  th: HTMLElement,
  state: 'none' | 'ascending' | 'descending',
) {
  let icon = th.querySelector<HTMLElement>('span.sort-icon')
  if (!icon) {
    icon = document.createElement('span')
    icon.className = 'sort-icon pi'
    icon.setAttribute('aria-hidden', 'true')
    th.appendChild(icon)
  }
  icon.classList.remove(
    'pi-sort-alt',
    'pi-sort-amount-up',
    'pi-sort-amount-down',
  )
  if (state === 'ascending') icon.classList.add('pi-sort-amount-up')
  else if (state === 'descending') icon.classList.add('pi-sort-amount-down')
  else icon.classList.add('pi-sort-alt')
}
function updateAriaSort() {
  const root = thead.value
  if (!root) return
  const allThs = root.querySelectorAll<HTMLElement>('th')
  allThs.forEach((th) => {
    const key = th.getAttribute('data-sort')
    const isSortable = key != null
    const val: 'none' | 'ascending' | 'descending' =
      isSortable && props.sortBy === key
        ? props.sortDir === 'asc'
          ? 'ascending'
          : props.sortDir === 'desc'
            ? 'descending'
            : 'none'
        : 'none'
    th.setAttribute('role', 'columnheader')
    th.setAttribute('aria-sort', val)
    if (isSortable) {
      th.setAttribute('tabindex', '0')
      ensureSortIcon(th, val)
    } else {
      th.removeAttribute('tabindex')
      const existing = th.querySelector('span.sort-icon')
      if (existing) existing.remove()
    }
  })
}
function onHeaderKeydown(e: KeyboardEvent) {
  const keyEl = (e.target as HTMLElement).closest(
    '[data-sort]',
  ) as HTMLElement | null
  if (!keyEl) return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const sortKey = keyEl.getAttribute('data-sort')
    if (!sortKey) return
    let nextDir: 'asc' | 'desc' = 'asc'
    if (props.sortBy === sortKey)
      nextDir = props.sortDir === 'asc' ? 'desc' : 'asc'
    emit('update:sortBy', sortKey)
    emit('update:sortDir', nextDir)
    emit('sort', { sortBy: sortKey, sortDir: nextDir })
  }
}
onMounted(updateAriaSort)
watch(
  () => [props.sortBy, props.sortDir],
  () => updateAriaSort(),
)
</script>

<style>
.data-table {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.table-scroll {
  width: 100%;
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
thead th {
  text-align: left;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
}
thead [data-sort] {
  cursor: pointer;
}
tbody td {
  padding: 10px 12px;
  border-top: 1px solid var(--color-border);
}
.empty {
  padding: var(--space-6);
  color: var(--color-text-secondary);
  text-align: center;
}
.header,
.footer {
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pagination {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
}
.btn {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Cards */
.cards {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-3);
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}

/* Sort icon positioning */
thead th {
  position: relative;
}
thead th .sort-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: 12px;
}
thead th[aria-sort='ascending'] .sort-icon,
thead th[aria-sort='descending'] .sort-icon {
  color: var(--color-text-secondary);
}
</style>
