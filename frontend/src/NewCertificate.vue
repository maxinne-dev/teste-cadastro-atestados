<template>
  <div class="container py-4">
    <PageHeader title="Novo Atestado" />
    <Card class="mt-4">
      <form @submit.prevent="onSubmit">
        <Banner v-if="formError" severity="warn" title="Corrija os campos" description="Algumas informações obrigatórias estão faltando." closable @close="formError=false" />
        <FormField label="Colaborador" :error="errors.collaboratorId" for="c">
          <BaseSelect id="c" v-model="form.collaboratorId" :options="collabOptions" placeholder="Selecione" />
        </FormField>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap:16px;">
          <FormField label="Início" :error="errors.startDate" for="start"><BaseDate id="start" v-model="form.startDate" /></FormField>
          <FormField label="Fim" :error="errors.endDate" for="end"><BaseDate id="end" v-model="form.endDate" /></FormField>
          <FormField label="Dias" :error="errors.days" for="days"><BaseInput id="days" type="number" v-model="daysStr" /></FormField>
        </div>
        <FormField label="Diagnóstico" for="diag"><BaseTextarea id="diag" v-model="form.diagnosis" /></FormField>
        <FormField label="CID" for="icd"><BaseInput id="icd" v-model="icdTerm" placeholder="Buscar CID (lista local)" /></FormField>
        <ul v-if="icdTerm.length >= 2" class="suggestions">
          <li v-for="icd in icdFiltered" :key="icd.code" @click="pickICD(icd)" class="sugg">{{ icd.code }} — {{ icd.title }}</li>
        </ul>
        <!-- Attachments placeholder (future file upload integration) -->
        <section class="attachments-placeholder" aria-labelledby="att-title">
          <h3 id="att-title">Anexos</h3>
          <p class="att-hint">(Futuro) Área para anexar arquivos do atestado (PDF, imagens). Não envia ainda.</p>
          <div class="att-drop" role="button" tabindex="0" aria-label="Área de anexos (placeholder)">
            <span class="att-icon" aria-hidden="true">📎</span>
            <span>Arraste e solte arquivos aqui ou clique para selecionar</span>
          </div>
          <ul class="att-list" v-if="pendingFiles.length">
            <li v-for="f in pendingFiles" :key="f.name">{{ f.name }} <small>({{ formatSize(f.size) }})</small></li>
          </ul>
        </section>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:16px;">
          <button class="btn" type="button" @click="reset">Limpar</button>
          <button class="btn primary" type="submit" :disabled="!canSubmit">Salvar</button>
        </div>
      </form>
    </Card>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from './components/PageHeader.vue'
import Card from './components/Card.vue'
import FormField from './components/base/FormField.vue'
import BaseSelect from './components/base/BaseSelect.vue'
import BaseDate from './components/base/BaseDate.vue'
import BaseInput from './components/base/BaseInput.vue'
import BaseTextarea from './components/base/BaseTextarea.vue'
import { icdList } from './mocks/data'
import Banner from './components/Banner.vue'
import { useCertificatesStore } from './stores/certificates'
import { useCollaboratorsStore } from './stores/collaborators'

const router = useRouter()
const certStore = useCertificatesStore()
const collabStore = useCollaboratorsStore()
onMounted(() => { if (!collabStore.items.length) collabStore.fetchAll() })
const collabOptions = computed(() => collabStore.items.map(c => ({ label: c.fullName, value: c.id })))
interface CertificateForm {
  collaboratorId: string | null
  startDate: string | null
  endDate: string | null
  days: number
  diagnosis: string
  icdCode?: string
  icdTitle?: string
}
const form = reactive<CertificateForm>({ collaboratorId: '' , startDate: '' , endDate: '' , days: 0, diagnosis: '' })
const errors = reactive<{ [k: string]: string | undefined }>({})
const formError = ref(false)
const icdTerm = ref('')
const icdFiltered = computed(() => icdList.filter(i => i.code.toLowerCase().includes(icdTerm.value.toLowerCase()) || i.title.toLowerCase().includes(icdTerm.value.toLowerCase())))

function pickICD(icd: { code: string; title: string }) { form.icdCode = icd.code; form.icdTitle = icd.title; icdTerm.value = `${icd.code} — ${icd.title}` }
const daysStr = ref('0')
watch([() => form.startDate, () => form.endDate], () => {
  if (form.startDate && form.endDate) {
    const d1 = new Date(form.startDate)
    const d2 = new Date(form.endDate)
    const diff = Math.max(1, Math.round((+d2 - +d1) / 86400000) + 1)
    daysStr.value = String(diff)
  }
})

function validate() {
  errors.collaboratorId = form.collaboratorId ? undefined : 'Obrigatório'
  errors.startDate = form.startDate ? undefined : 'Obrigatório'
  errors.endDate = form.endDate ? undefined : 'Obrigatório'
  const days = Number(daysStr.value || 0)
  errors.days = days > 0 ? undefined : 'Informe os dias'
  if (form.startDate && form.endDate) {
    const s = new Date(form.startDate)
    const e = new Date(form.endDate)
    if (s > e) errors.endDate = 'Fim deve ser após o início'
  }
  return !Object.values(errors).some(Boolean)
}
function onSubmit() {
  if (!validate()) { formError.value = true; return }
  certStore.create({ collaboratorId: form.collaboratorId!, startDate: form.startDate!, endDate: form.endDate!, days: Number(daysStr.value || 0), diagnosis: form.diagnosis, icdCode: form.icdCode, icdTitle: form.icdTitle })
  router.push({ name: 'certificates' })
}
const canSubmit = computed(() => {
  if (!form.collaboratorId || !form.startDate || !form.endDate) return false
  const s = new Date(form.startDate)
  const e = new Date(form.endDate)
  const days = Number(daysStr.value || 0)
  return s <= e && days > 0
})
function reset() {
  form.collaboratorId = ''
  form.startDate = form.endDate = ''
  form.diagnosis = ''
  daysStr.value = '0'
  icdTerm.value = ''
  pendingFiles.value = []
}

// Attachments placeholder logic (no real upload)
const pendingFiles = ref<{ name: string; size: number }[]>([])
function formatSize(size: number) {
  if (size < 1024) return size + 'B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + 'KB'
  return (size / (1024 * 1024)).toFixed(2) + 'MB'
}
</script>
<style scoped>
.btn { padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; }
.primary { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
.suggestions { list-style: none; margin: 8px 0 0; padding: 0; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
.sugg { padding: 8px 12px; cursor: pointer; background: var(--color-surface-2); }
.sugg:hover { background: var(--color-surface); }
.attachments-placeholder { margin-top:24px; border-top:1px solid var(--color-border); padding-top:16px; }
.attachments-placeholder h3 { margin:0 0 4px; font-size:1rem; }
.att-hint { margin:0 0 8px; font-size:0.75rem; color: var(--color-text-secondary); }
.att-drop { display:flex; flex-direction:column; align-items:center; gap:4px; padding:20px; border:2px dashed var(--color-border); border-radius: var(--radius-md); font-size:0.875rem; color: var(--color-text-secondary); background: var(--color-surface-2); }
.att-drop:focus { outline:2px solid var(--color-primary); outline-offset:2px; }
.att-icon { font-size:1.25rem; }
.att-list { list-style:none; padding:8px 0 0; margin:0; font-size:0.75rem; display:grid; gap:4px; }
</style>
