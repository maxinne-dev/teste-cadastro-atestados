<template>
  <div class="container py-4">
    <PageHeader title="Atestados">
      <template #actions>
        <router-link class="btn" :to="{ name: 'new-certificate' }">Novo</router-link>
      </template>
    </PageHeader>
    <Toolbar class="mt-4">
      <BaseSelect v-model="collab" :options="collabOptions" placeholder="Colaborador" />
      <BaseDate v-model="start" />
      <BaseDate v-model="end" />
      <BaseSelect v-model="status" :options="statusOptions" placeholder="Status" />
      <BaseInput v-model="icd" placeholder="CID (texto)" />
    </Toolbar>
    <div class="mt-4">
      <DataTable :rows="filtered" :rowsPerPage="rowsPerPage" :page="page" @update:page="page = $event" :sortBy="sortBy" :sortDir="sortDir" @update:sortBy="sortBy = $event" @update:sortDir="sortDir = $event">
        <template #columns>
          <tr>
            <th>Colaborador</th><th data-sort="startDate">Período</th><th data-sort="days">Dias</th><th data-sort="icdCode">CID</th><th data-sort="status">Status</th><th>Ações</th>
          </tr>
        </template>
        <template #row="{ row }">
          <tr>
            <td>{{ nameOf(row.collaboratorId) }}</td>
            <td>{{ d(row.startDate) }} – {{ d(row.endDate) }}</td>
            <td>{{ row.days }}</td>
            <td>{{ row.icdCode }} {{ row.icdTitle ? '– ' + row.icdTitle : '' }}</td>
            <td>{{ row.status }}</td>
            <td>
              <button class="btn" @click="view(row)">Detalhes</button>
              <button class="btn" @click="confirmCancel(row)" :disabled="row.status !== 'active'">Cancelar</button>
            </td>
          </tr>
        </template>
        <template #empty>
          <EmptyState icon="pi-calendar" title="Nenhum atestado" description="Ajuste os filtros ou crie um novo.">
            <template #actions>
              <router-link class="btn primary" :to="{ name: 'new-certificate' }">Novo atestado</router-link>
            </template>
          </EmptyState>
        </template>
      </DataTable>
    </div>
    
    <Modal :visible="drawer" @update:visible="drawer = $event" title="Detalhes do atestado">
      <p><strong>Colaborador:</strong> {{ nameOf(current?.collaboratorId) }}</p>
      <p><strong>Período:</strong> {{ d(current?.startDate) }} – {{ d(current?.endDate) }} ({{ current?.days }} dias)</p>
      <p><strong>CID:</strong> {{ current?.icdCode }} — {{ current?.icdTitle }}</p>
      <p><strong>Status:</strong> {{ current?.status }}</p>
      <p><strong>Diagnóstico:</strong> {{ current?.diagnosis }}</p>
    </Modal>

    <ConfirmDialog :visible="confirm" title="Cancelar atestado" :message="'Confirmar cancelamento? Esta ação é reversível no mock.'" @update:visible="confirm = $event" @confirm="doCancel" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import PageHeader from './components/PageHeader.vue'
import Toolbar from './components/Toolbar.vue'
import DataTable from './components/DataTable.vue'
import Modal from './components/Modal.vue'
import EmptyState from './components/EmptyState.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import BaseSelect from './components/base/BaseSelect.vue'
import BaseDate from './components/base/BaseDate.vue'
import BaseInput from './components/base/BaseInput.vue'
import type { Certificate } from './mocks/data'
import { useCertificatesStore } from './stores/certificates'
import { useCollaboratorsStore } from './stores/collaborators'
import { formatDateBR } from './utils/formatters'

const certStore = useCertificatesStore()
const collabStore = useCollaboratorsStore()
onMounted(() => { if (!certStore.items.length) certStore.fetchAll(); if (!collabStore.items.length) collabStore.fetchAll() })
const rows = computed(() => certStore.items)
const collabOptions = computed(() => [{ label: 'Todos', value: null as any }, ...collabStore.items.map(c => ({ label: c.fullName, value: c.id }))])
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
const rowsPerPage = 5
const sortBy = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc' | null>(null)

const filtered = computed(() => rows.value.filter(r => {
  const okCollab = collab.value == null || r.collaboratorId === collab.value
  const okStatus = status.value == null || r.status === status.value
  const okStart = !start.value || r.startDate >= start.value
  const okEnd = !end.value || r.endDate <= end.value
  const okIcd = !icd.value || (r.icdCode?.toLowerCase().includes(icd.value.toLowerCase()) || r.icdTitle?.toLowerCase().includes(icd.value.toLowerCase()))
  return okCollab && okStatus && okStart && okEnd && okIcd
}))

function nameOf(id?: string) { return collabStore.items.find(c => c.id === id)?.fullName || '' }
function d(date?: string | null) { return formatDateBR(date || '') }

const drawer = ref(false)
const current = ref<Certificate | null>(null)
function view(row: Certificate) { current.value = row; drawer.value = true }

const confirm = ref(false)
let toCancel: Certificate | null = null
function confirmCancel(row: Certificate) { toCancel = row; confirm.value = true }
function doCancel() {
  if (!toCancel) return
  certStore.cancel(toCancel.id)
}
</script>
<style scoped>
.btn { padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; }
</style>
