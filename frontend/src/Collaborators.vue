<template>
  <div class="container py-4">
    <PageHeader title="Colaboradores">
      <template #actions>
        <button class="btn primary" @click="openCreate">Novo</button>
      </template>
    </PageHeader>
    <Toolbar class="mt-4">
      <BaseInput v-model="search" placeholder="Buscar nome ou CPF" />
      <BaseSelect
        v-model="status"
        :options="statusOptions"
        placeholder="Status"
      />
    </Toolbar>
    <div class="mt-4">
      <DataTable
        :rows="rows"
        :total="collabStore.total"
        :loading="collabStore.loading"
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
            <th data-sort="fullName">Nome</th>
            <th data-sort="cpf">CPF</th>
            <th data-sort="department">Departamento</th>
            <th data-sort="position">Cargo</th>
            <th data-sort="status">Status</th>
            <th>Ações</th>
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
              <button class="btn" @click="confirmToggle(row)">
                {{ row.status === 'active' ? 'Desativar' : 'Ativar' }}
              </button>
            </td>
          </tr>
        </template>
        <template #card="{ row }">
          <div class="card-row">
            <div class="card-header">
              <strong>{{ row.fullName }}</strong>
              <span class="status" :data-status="row.status">{{
                row.status
              }}</span>
            </div>
            <div class="card-grid">
              <div>
                <small class="muted">CPF</small>
                <div>{{ displayCpf(row.cpf) }}</div>
              </div>
              <div>
                <small class="muted">Departamento</small>
                <div>{{ row.department }}</div>
              </div>
              <div>
                <small class="muted">Cargo</small>
                <div>{{ row.position }}</div>
              </div>
            </div>
            <div class="card-actions">
              <button class="btn" @click="view(row)">Ver</button>
              <button class="btn" @click="edit(row)">Editar</button>
              <button class="btn" @click="confirmToggle(row)">
                {{ row.status === 'active' ? 'Desativar' : 'Ativar' }}
              </button>
            </div>
          </div>
        </template>
        <template #empty>
          <EmptyState
            icon="pi-user"
            title="Nenhum colaborador"
            description="Ajuste os filtros ou cadastre um novo colaborador."
          >
            <template #actions>
              <button class="btn primary" @click="openCreate">
                Novo colaborador
              </button>
            </template>
          </EmptyState>
        </template>
      </DataTable>
    </div>

    <SidePanel :visible="drawer" @update:visible="drawer = $event">
      <div class="tabs">
        <button
          class="tab"
          :class="{ active: tab === 'profile' }"
          @click="tab = 'profile'"
        >
          Perfil
        </button>
        <button
          class="tab"
          :class="{ active: tab === 'certs' }"
          @click="tab = 'certs'"
        >
          Atestados
        </button>
      </div>
      <div v-if="tab === 'profile'">
        <p><strong>Nome:</strong> {{ current?.fullName }}</p>
        <p><strong>CPF:</strong> {{ displayCpf(current?.cpf || '') }}</p>
        <p><strong>Departamento:</strong> {{ current?.department }}</p>
        <p><strong>Cargo:</strong> {{ current?.position }}</p>
        <p>
          <strong>Nascimento:</strong> {{ dateBR(current?.birthDate || '') }}
        </p>
        <p><strong>Status:</strong> {{ current?.status }}</p>
      </div>
      <div v-else>
        <ul>
          <li v-for="m in certsOfCurrent" :key="m.id">
            {{ m.startDate }} – {{ m.endDate }} ({{ m.days }}d) — {{ m.status }}
          </li>
        </ul>
      </div>
    </SidePanel>

    <SidePanel :visible="editor" @update:visible="editor = $event">
      <template #header>
        <h3 style="margin: 0">
          {{ editing?.id ? 'Editar' : 'Novo' }} colaborador
        </h3>
      </template>
      <form @submit.prevent="save">
        <Banner
          v-if="formErrorBanner"
          severity="warn"
          title="Preencha os campos obrigatórios"
          description="Revise os campos destacados abaixo."
          closable
          @close="formErrorBanner = false"
        />
        <FormField
          label="Nome completo"
          :error="formErrors.fullName"
          for="fullName"
        >
          <BaseInput id="fullName" v-model="editing.fullName" />
        </FormField>
        <FormField label="CPF" :error="formErrors.cpf" for="cpf">
          <BaseInput id="cpf" v-model="editing.cpf" v-mask="'cpf'" />
        </FormField>
        <FormField label="Nascimento" :error="formErrors.birthDate" for="birth">
          <BaseDate id="birth" v-model="editing.birthDate" />
        </FormField>
        <FormField label="Cargo" :error="formErrors.position" for="position">
          <BaseInput id="position" v-model="editing.position" />
        </FormField>
        <FormField
          label="Departamento"
          :error="formErrors.department"
          for="department"
        >
          <BaseInput id="department" v-model="editing.department" />
        </FormField>
        <FormField label="Status" for="status">
          <BaseSelect
            id="status"
            v-model="editing.status"
            :options="statusOptionsNoAll"
          />
        </FormField>
        <div style="display: flex; gap: 8px; justify-content: flex-end">
          <button class="btn" type="button" @click="editor = false">
            Cancelar
          </button>
          <button class="btn primary" type="submit" :disabled="!canSave">
            Salvar
          </button>
        </div>
      </form>
    </SidePanel>

    <ConfirmDialog
      :visible="confirm"
      title="Confirmar"
      :message="confirmMsg"
      @update:visible="confirm = $event"
      @confirm="doToggle"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch } from 'vue'
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
import type { Collaborator } from './types/models'
import { useCollaboratorsStore } from './stores/collaborators'
import { useCertificatesStore } from './stores/certificates'
import { formatCpf, formatDateBR, normalizeCpf } from './utils/formatters'
import { isValidCpf, isNonEmptyString, isValidIsoDate } from './utils/validators'
import { useNotify } from './composables/useNotify'

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
const certStore = useCertificatesStore()
onMounted(() => {
  if (!certStore.items.length) certStore.fetchAll()
  refetch()
})
const sortBy = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc' | null>(null)
const page = ref(1)
const rowsPerPage = ref(10)
function refetch() {
  collabStore.fetchAll({
    q: search.value,
    status: (status.value as any) || undefined,
    sortBy: (sortBy.value as any) || 'fullName',
    sortDir: (sortDir.value as any) || 'asc',
    limit: rowsPerPage.value,
    offset: (page.value - 1) * rowsPerPage.value,
  })
}
watch([sortBy, sortDir, search, status], () => {
  page.value = 1
  refetch()
})
function onPageChange(p: number) {
  page.value = p
  refetch()
}
function onRowsPerPageChange(n: number) {
  rowsPerPage.value = n
  page.value = 1
  refetch()
}

const drawer = ref(false)
const editor = ref(false)
const current = ref<Collaborator | null>(null)
const tab = ref<'profile' | 'certs'>('profile')
const certsOfCurrent = computed(() =>
  current.value ? certStore.byCollaborator(current.value.id || '') : [],
)
const editing = reactive<Collaborator>({
  id: '',
  fullName: '',
  cpf: '',
  birthDate: '',
  department: '',
  position: '',
  status: 'active',
})
const formErrors = reactive<{ [k: string]: string | undefined }>({})
const formErrorBanner = ref(false)
const confirm = ref(false)
const confirmTarget = ref<Collaborator | null>(null)
const confirmMsg = ref('')

function openCreate() {
  Object.assign(editing, {
    id: '',
    fullName: '',
    cpf: '',
    birthDate: '',
    department: '',
    position: '',
    status: 'active',
  })
  formErrors.fullName =
    formErrors.cpf =
    formErrors.birthDate =
    formErrors.position =
    formErrors.department =
      undefined
  editor.value = true
}
function view(row: Collaborator) {
  current.value = row
  drawer.value = true
}
function edit(row: Collaborator) {
  Object.assign(editing, row)
  editor.value = true
}
function validate() {
  // Mirror backend DTOs: department is optional
  formErrors.fullName = isNonEmptyString(editing.fullName)
    ? undefined
    : 'Obrigatório'
  const cpfDigits = normalizeCpf(editing.cpf)
  if (cpfDigits.length !== 11) formErrors.cpf = 'CPF inválido'
  else if (!isValidCpf(cpfDigits)) formErrors.cpf = 'CPF inválido'
  else formErrors.cpf = undefined
  formErrors.birthDate = isValidIsoDate(editing.birthDate)
    ? undefined
    : 'Obrigatório'
  formErrors.position = isNonEmptyString(editing.position)
    ? undefined
    : 'Obrigatório'
  // department optional: no error
  formErrors.department = undefined
  return !Object.values(formErrors).some(Boolean)
}
const { notifySuccess, notifyError, notifyInfo, notifyWarn } = useNotify()
async function save() {
  if (!validate()) {
    formErrorBanner.value = true
    return
  }
  try {
    await collabStore.save(editing as Collaborator)
    notifySuccess('Colaborador salvo')
    editor.value = false
    formErrorBanner.value = false
  } catch (e: any) {
    const status = e?.status
    if (status === 409) {
      notifyError('CPF já cadastrado', 'Revise o CPF informado')
    } else if (status === 422 || status === 400) {
      notifyWarn('Dados inválidos', e?.message || 'Revise os campos')
    } else if (status === 403) {
      notifyError('Sem permissão', 'Ação não autorizada')
    } else if (status === 401) {
      notifyInfo('Sessão expirada', 'Faça login novamente')
    } else {
      notifyError('Erro ao salvar', e?.message || 'Tente novamente')
    }
  }
}
function confirmToggle(row: Collaborator) {
  confirmTarget.value = row
  confirmMsg.value = `Confirmar ${row.status === 'active' ? 'desativação' : 'ativação'}?`
  confirm.value = true
}
async function doToggle() {
  if (!confirmTarget.value) return
  // Toggle by CPF via API
  try {
    await collabStore.toggleStatus(confirmTarget.value.cpf)
    notifySuccess('Status atualizado')
  } catch (e: any) {
    notifyError('Erro ao atualizar status', e?.message || 'Tente novamente')
  }
}

function displayCpf(cpf: string) {
  return formatCpf(cpf)
}
function dateBR(date: string) {
  return formatDateBR(date)
}
const canSave = computed(() => {
  // Keep lightweight checks to match tests: require core fields and 11-digit CPF
  const cpfDigits = normalizeCpf(editing.cpf)
  return Boolean(
    editing.fullName && editing.birthDate && editing.position && cpfDigits.length === 11,
  )
})
</script>
<style scoped>
.btn {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
}
.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
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
.status[data-status='inactive'] {
  color: var(--color-text-muted);
  background: var(--color-surface);
}
</style>
