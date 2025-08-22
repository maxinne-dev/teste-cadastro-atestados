<template>
  <div class="container py-4">
    <PageHeader title="Colaboradores">
      <template #actions>
        <button class="btn primary" @click="openCreate">Novo</button>
      </template>
    </PageHeader>
    <Toolbar class="mt-4">
      <BaseInput v-model="search" placeholder="Buscar nome ou CPF" />
      <BaseSelect v-model="status" :options="statusOptions" placeholder="Status" />
    </Toolbar>
    <div class="mt-4">
      <DataTable :rows="filtered" :rowsPerPage="10" :sortBy="sortBy" :sortDir="sortDir" @update:sortBy="sortBy = $event" @update:sortDir="sortDir = $event" :cardBreakpoint="768">
        <template #columns>
          <tr>
            <th data-sort="fullName">Nome</th><th data-sort="cpf">CPF</th><th data-sort="department">Departamento</th><th data-sort="position">Cargo</th><th data-sort="status">Status</th><th>Ações</th>
          </tr>
        </template>
        <template #row="{ row }">
          <tr>
            <td>{{ row.fullName }}</td>
            <td>{{ displayCpf(row.cpf) }}</td>
            <td>{{ row.department }}</td>
            <td>{{ row.position }}</td>
            <td>{{ row.status }}</td>
            <td>
              <button class="btn" @click="view(row)">Ver</button>
              <button class="btn" @click="edit(row)">Editar</button>
              <button class="btn" @click="confirmToggle(row)">{{ row.status === 'active' ? 'Desativar' : 'Ativar' }}</button>
            </td>
          </tr>
        </template>
        <template #card="{ row }">
          <div class="card-row">
            <div class="card-header">
              <strong>{{ row.fullName }}</strong>
              <span class="status" :data-status="row.status">{{ row.status }}</span>
            </div>
            <div class="card-grid">
              <div><small class="muted">CPF</small><div>{{ displayCpf(row.cpf) }}</div></div>
              <div><small class="muted">Departamento</small><div>{{ row.department }}</div></div>
              <div><small class="muted">Cargo</small><div>{{ row.position }}</div></div>
            </div>
            <div class="card-actions">
              <button class="btn" @click="view(row)">Ver</button>
              <button class="btn" @click="edit(row)">Editar</button>
              <button class="btn" @click="confirmToggle(row)">{{ row.status === 'active' ? 'Desativar' : 'Ativar' }}</button>
            </div>
          </div>
        </template>
        <template #empty>
          <EmptyState icon="pi-user" title="Nenhum colaborador" description="Ajuste os filtros ou cadastre um novo colaborador.">
            <template #actions>
              <button class="btn primary" @click="openCreate">Novo colaborador</button>
            </template>
          </EmptyState>
        </template>
      </DataTable>
    </div>

    <SidePanel :visible="drawer" @update:visible="drawer = $event">
      <div class="tabs">
        <button class="tab" :class="{active: tab==='profile'}" @click="tab='profile'">Perfil</button>
        <button class="tab" :class="{active: tab==='certs'}" @click="tab='certs'">Atestados</button>
      </div>
      <div v-if="tab==='profile'">
        <p><strong>Nome:</strong> {{ current?.fullName }}</p>
        <p><strong>CPF:</strong> {{ displayCpf(current?.cpf || '') }}</p>
        <p><strong>Departamento:</strong> {{ current?.department }}</p>
        <p><strong>Cargo:</strong> {{ current?.position }}</p>
        <p><strong>Nascimento:</strong> {{ dateBR(current?.birthDate || '') }}</p>
        <p><strong>Status:</strong> {{ current?.status }}</p>
      </div>
      <div v-else>
        <ul>
          <li v-for="m in certsOfCurrent" :key="m.id">{{ m.startDate }} – {{ m.endDate }} ({{ m.days }}d) — {{ m.status }}</li>
        </ul>
      </div>
    </SidePanel>

    <SidePanel :visible="editor" @update:visible="editor = $event">
      <template #header><h3 style="margin:0">{{ editing?.id ? 'Editar' : 'Novo' }} colaborador</h3></template>
      <form @submit.prevent="save">
        <Banner v-if="formErrorBanner" severity="warn" title="Preencha os campos obrigatórios" description="Revise os campos destacados abaixo." closable @close="formErrorBanner=false" />
        <FormField label="Nome completo" :error="formErrors.fullName" for="fullName"><BaseInput id="fullName" v-model="editing.fullName" /></FormField>
        <FormField label="CPF" :error="formErrors.cpf" for="cpf"><BaseInput id="cpf" v-model="editing.cpf" v-mask="'cpf'" /></FormField>
        <FormField label="Nascimento" :error="formErrors.birthDate" for="birth"><BaseDate id="birth" v-model="editing.birthDate" /></FormField>
        <FormField label="Cargo" :error="formErrors.position" for="position"><BaseInput id="position" v-model="editing.position" /></FormField>
        <FormField label="Departamento" :error="formErrors.department" for="department"><BaseInput id="department" v-model="editing.department" /></FormField>
        <FormField label="Status" for="status"><BaseSelect id="status" v-model="editing.status" :options="statusOptionsNoAll" /></FormField>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn" type="button" @click="editor = false">Cancelar</button>
          <button class="btn primary" type="submit">Salvar</button>
        </div>
      </form>
    </SidePanel>

    <ConfirmDialog :visible="confirm" title="Confirmar" :message="confirmMsg" @update:visible="confirm = $event" @confirm="doToggle" />
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import PageHeader from './components/PageHeader.vue'
import Toolbar from './components/Toolbar.vue'
import DataTable from './components/DataTable.vue'
import SidePanel from './components/SidePanel.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import EmptyState from './components/EmptyState.vue'
import Banner from './components/Banner.vue'
import FormField from './components/base/FormField.vue'
import BaseInput from './components/base/BaseInput.vue'
import BaseSelect from './components/base/BaseSelect.vue'
import BaseDate from './components/base/BaseDate.vue'
import { Collaborator, certificates } from './mocks/data'
import { useCollaboratorsStore } from './stores/collaborators'
import { formatCpf, formatDateBR } from './utils/formatters'

const search = ref('')
const status = ref<string | null>(null)
const statusOptions = [
  { label: 'Todos', value: null as any },
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
]
const statusOptionsNoAll = statusOptions.slice(1)
const collabStore = useCollaboratorsStore()
const rows = computed(() => collabStore.items)
onMounted(() => { if (!collabStore.items.length) collabStore.fetchAll() })
const sortBy = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc' | null>(null)
const filtered = computed(() => rows.value.filter(r => {
  const s = (search.value || '').toLowerCase()
  const okSearch = !s || r.fullName.toLowerCase().includes(s) || r.cpf.includes(s)
  const okStatus = status.value == null || r.status === status.value
  return okSearch && okStatus
}))

const drawer = ref(false)
const editor = ref(false)
const current = ref<Collaborator | null>(null)
const tab = ref<'profile' | 'certs'>('profile')
const certsOfCurrent = computed(() => current.value ? certificates.filter(c => c.collaboratorId === current.value?.id) : [])
const editing = reactive<Collaborator>({ id: '', fullName: '', cpf: '', birthDate: '', department: '', position: '', status: 'active' })
const formErrors = reactive<{ [k: string]: string | undefined }>({})
const formErrorBanner = ref(false)
const confirm = ref(false)
const confirmTarget = ref<Collaborator | null>(null)
const confirmMsg = ref('')

function openCreate() {
  Object.assign(editing, { id: '', fullName: '', cpf: '', birthDate: '', department: '', position: '', status: 'active' })
  formErrors.fullName = formErrors.cpf = formErrors.birthDate = formErrors.position = formErrors.department = undefined
  editor.value = true
}
function view(row: Collaborator) { current.value = row; drawer.value = true }
function edit(row: Collaborator) { Object.assign(editing, row); editor.value = true }
function validate() {
  formErrors.fullName = editing.fullName ? undefined : 'Obrigatório'
  formErrors.cpf = editing.cpf ? undefined : 'Obrigatório'
  formErrors.birthDate = editing.birthDate ? undefined : 'Obrigatório'
  formErrors.position = editing.position ? undefined : 'Obrigatório'
  formErrors.department = editing.department ? undefined : 'Obrigatório'
  return !Object.values(formErrors).some(Boolean)
}
function save() {
  if (!validate()) { formErrorBanner.value = true; return }
  collabStore.save(editing as Collaborator)
  editor.value = false
  formErrorBanner.value = false
}
function confirmToggle(row: Collaborator) { confirmTarget.value = row; confirmMsg.value = `Confirmar ${row.status === 'active' ? 'desativação' : 'ativação'}?`; confirm.value = true }
function doToggle() {
  if (!confirmTarget.value) return
  collabStore.toggleStatus(confirmTarget.value.id)
}

function displayCpf(cpf: string) { return formatCpf(cpf) }
function dateBR(date: string) { return formatDateBR(date) }
</script>
<style scoped>
.btn { padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; }
.primary { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
/* Card styles for responsive table */
.card-row { display: flex; flex-direction: column; gap: var(--space-2); }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
@media (max-width: 420px) { .card-grid { grid-template-columns: 1fr; } }
.card-actions { display: flex; gap: 8px; justify-content: flex-end; }
.muted { color: var(--color-text-secondary); }
.status { font-size: var(--fs-caption); padding: 2px 8px; border-radius: var(--radius-pill); border: 1px solid var(--color-border); background: var(--color-surface); text-transform: capitalize; }
.status[data-status="active"] { color: var(--color-success); border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 12%, transparent); }
.status[data-status="inactive"] { color: var(--color-text-muted); background: var(--color-surface); }
</style>
