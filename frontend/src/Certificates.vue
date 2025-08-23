<template>
  <div class="container py-4">
    <PageHeader title="Atestados">
      <template #actions>
        <router-link class="btn" :to="{ name: 'new-certificate' }">
          Novo
        </router-link>
      </template>
    </PageHeader>
    <Toolbar class="mt-4">
      <BaseSelect
        v-model="collab"
        :options="collabOptions"
        placeholder="Colaborador"
      />
      <BaseDate v-model="start" />
      <BaseDate v-model="end" />
      <BaseSelect
        v-model="status"
        :options="statusOptions"
        placeholder="Status"
      />
      <BaseInput v-model="icd" placeholder="CID (texto)" />
    </Toolbar>
    <div class="mt-4">
      <DataTable
        :rows="rows"
        :total="certStore.total"
        :loading="certStore.loading"
        :rows-per-page="rowsPerPage"
        :page="page"
        :sort-by="sortBy"
        :sort-dir="sortDir"
        :remote-paging="true"
        :card-breakpoint="768"
        @update:page="onPageChange"
        @update:rows-per-page="onRowsPerPageChange"
        @update:sort-by="sortBy = $event; refetch()"
        @update:sort-dir="sortDir = $event; refetch()"
      >
        <template #columns>
          <tr>
            <th>Colaborador</th>
            <th data-sort="startDate">Período</th>
            <th data-sort="days">Dias</th>
            <th data-sort="icdCode">CID</th>
            <th data-sort="status">Status</th>
            <th>Ações</th>
          </tr>
        </template>
        <template #row="{ row }">
          <tr>
            <td>{{ nameOf(row.collaboratorId) }}</td>
            <td>{{ d(row.startDate) }} – {{ d(row.endDate) }}</td>
            <td>{{ row.days }}</td>
            <td>
              {{ row.icdCode }} {{ row.icdTitle ? '– ' + row.icdTitle : '' }}
            </td>
            <td>{{ row.status }}</td>
            <td>
              <button class="btn" @click="view(row)">Detalhes</button>
              <button
                class="btn"
                :disabled="row.status !== 'active'"
                @click="confirmCancel(row)"
              >
                Cancelar
              </button>
            </td>
          </tr>
        </template>
        <template #card="{ row }">
          <div class="card-row">
            <div class="card-header">
              <strong>{{ nameOf(row.collaboratorId) }}</strong>
              <span class="status" :data-status="row.status">{{
                row.status
              }}</span>
            </div>
            <div class="card-grid">
              <div>
                <small class="muted">Período</small>
                <div>
                  {{ d(row.startDate) }} – {{ d(row.endDate) }} ({{
                    row.days
                  }}d)
                </div>
              </div>
              <div>
                <small class="muted">CID</small>
                <div>
                  {{ row.icdCode }}
                  {{ row.icdTitle ? '– ' + row.icdTitle : '' }}
                </div>
              </div>
            </div>
            <div class="card-actions">
              <button class="btn" @click="view(row)">Detalhes</button>
              <button
                class="btn"
                :disabled="row.status !== 'active'"
                @click="confirmCancel(row)"
              >
                Cancelar
              </button>
            </div>
          </div>
        </template>
        <template #empty>
          <EmptyState
            icon="pi-calendar"
            title="Nenhum atestado"
            description="Ajuste os filtros ou crie um novo."
          >
            <template #actions>
              <router-link
                class="btn primary"
                :to="{ name: 'new-certificate' }"
              >
                Novo atestado
              </router-link>
            </template>
          </EmptyState>
        </template>
      </DataTable>
    </div>

    <Modal
      :visible="drawer"
      title="Detalhes do atestado"
      @update:visible="drawer = $event"
    >
      <p><strong>Colaborador:</strong> {{ nameOf(current?.collaboratorId) }}</p>
      <p>
        <strong>Período:</strong> {{ d(current?.startDate) }} –
        {{ d(current?.endDate) }} ({{ current?.days }} dias)
      </p>
      <p>
        <strong>CID:</strong> {{ current?.icdCode }} — {{ current?.icdTitle }}
      </p>
      <p><strong>Status:</strong> {{ current?.status }}</p>
      <p><strong>Diagnóstico:</strong> {{ current?.diagnosis }}</p>
    </Modal>

    <ConfirmDialog
      :visible="confirm"
      title="Cancelar atestado"
      :message="'Confirmar cancelamento? Esta ação é reversível no mock.'"
      @update:visible="confirm = $event"
      @confirm="doCancel"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import PageHeader from './components/PageHeader.vue'
import Toolbar from './components/Toolbar.vue'
import DataTable from './components/DataTable.vue'
import Modal from './components/Modal.vue'
import EmptyState from './components/EmptyState.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import BaseSelect from './components/base/BaseSelect.vue'
import BaseDate from './components/base/BaseDate.vue'
import BaseInput from './components/base/BaseInput.vue'
import type { Certificate } from './types/models'
import { useCertificatesStore } from './stores/certificates'
import { useCollaboratorsStore } from './stores/collaborators'
import { formatDateBR } from './utils/formatters'
import { useNotify } from './composables/useNotify'

const certStore = useCertificatesStore()
const collabStore = useCollaboratorsStore()
onMounted(() => {
  if (!collabStore.items.length) collabStore.fetchAll()
  refetch()
})
const rows = computed(() => certStore.items)
const collabOptions = computed(() => [
  { label: 'Todos', value: null as any },
  ...collabStore.items.map((c) => ({ label: c.fullName, value: c.id })),
])
const statusOptions = [
  { label: 'Todos', value: null as any },
  { label: 'Ativo', value: 'active' },
  { label: 'Cancelado', value: 'cancelled' },
  { label: 'Expirado', value: 'expired' },
]
const collab = ref<string | null>(null)
const start = ref<string | null>(null)
const end = ref<string | null>(null)
const status = ref<string | null>(null)
const icd = ref('')
const page = ref(1)
const rowsPerPage = ref(5)
const sortBy = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc' | null>(null)

function refetch() {
  certStore.fetchAll({
    collaboratorId: collab.value || undefined,
    status: (status.value as any) || undefined,
    startDate: start.value || undefined,
    endDate: end.value || undefined,
    icdCode: icd.value || undefined,
    limit: rowsPerPage.value,
    offset: (page.value - 1) * rowsPerPage.value,
    sortBy: (sortBy.value as any) || 'issueDate',
    sortDir: (sortDir.value as any) || 'desc',
  })
}
function onPageChange(p: number) {
  page.value = p
  refetch()
}
function onRowsPerPageChange(n: number) {
  rowsPerPage.value = n
  page.value = 1
  refetch()
}
watch([collab, start, end, status, icd], () => {
  page.value = 1
  refetch()
})

function nameOf(id?: string) {
  return collabStore.items.find((c) => c.id === id)?.fullName || ''
}
function d(date?: string | null) {
  return formatDateBR(date || '')
}

const drawer = ref(false)
const current = ref<Certificate | null>(null)
function view(row: Certificate) {
  current.value = row
  drawer.value = true
}

const confirm = ref(false)
let toCancel: Certificate | null = null
function confirmCancel(row: Certificate) {
  toCancel = row
  confirm.value = true
}
const { notifySuccess, notifyError, notifyInfo } = useNotify()
async function doCancel() {
  if (!toCancel) return
  try {
    await certStore.cancel(toCancel.id)
    notifySuccess('Atestado cancelado')
  } catch (e: any) {
    const status = e?.status
    if (status === 403) notifyError('Sem permissão', 'Ação não autorizada')
    else if (status === 401) notifyInfo('Sessão expirada', 'Faça login novamente')
    else notifyError('Erro ao cancelar', e?.message || 'Tente novamente')
  }
}
</script>
<style scoped>
.btn {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
}
/* Card styles for responsive table */
.card-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
@media (max-width: 420px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.muted {
  color: var(--color-text-secondary);
}
.status {
  font-size: var(--fs-caption);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  text-transform: capitalize;
}
.status[data-status='active'] {
  color: var(--color-success);
  border-color: var(--color-success);
  background: color-mix(in srgb, var(--color-success) 12%, transparent);
}
.status[data-status='cancelled'],
.status[data-status='expired'] {
  color: var(--color-error);
  border-color: var(--color-error);
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
}
</style>
