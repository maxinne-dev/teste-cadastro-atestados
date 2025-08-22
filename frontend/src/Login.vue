<template>
  <div class="container" style="max-width: 420px; padding-top: 64px">
    <Card>
      <h2 style="margin-top: 0">Entrar</h2>
      <form @submit.prevent="onSubmit">
        <Banner
          v-if="formError"
          severity="error"
          title="Não foi possível entrar"
          description="Verifique os campos informados e tente novamente."
          closable
          @close="formError = false"
        />
        <FormField label="Email" :error="errors.email" for="email">
          <BaseInput
            id="email"
            v-model="email"
            type="email"
            placeholder="email@empresa.com"
          />
        </FormField>
        <FormField label="Senha" :error="errors.password" for="password">
          <BasePassword
            id="password"
            v-model="password"
            placeholder="••••••••"
          />
        </FormField>
        <label
          style="
            display: flex;
            gap: 8px;
            align-items: center;
            margin-bottom: 16px;
          "
        >
          <input v-model="remember" type="checkbox" /> Lembrar-me
        </label>
        <button class="btn primary" type="submit" :disabled="!canSubmit">
          Entrar
        </button>
      </form>
    </Card>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from './components/Card.vue'
import FormField from './components/base/FormField.vue'
import BaseInput from './components/base/BaseInput.vue'
import BasePassword from './components/base/BasePassword.vue'
import Banner from './components/Banner.vue'

const router = useRouter()
const email = ref('')
const password = ref('')
const remember = ref(false)
const errors = ref<{ email?: string; password?: string }>({})
const formError = ref(false)

const canSubmit = computed(
  () => /.+@.+\..+/.test(email.value) && password.value.length > 0,
)

function onSubmit() {
  errors.value = {}
  if (!/.+@.+\..+/.test(email.value))
    errors.value.email = 'Informe um email válido'
  if (!password.value) errors.value.password = 'Informe sua senha'
  if (Object.keys(errors.value).length) {
    formError.value = true
    return
  }
  localStorage.setItem('token', 'dev')
  if (remember.value) localStorage.setItem('remember', '1')
  router.push('/')
}
</script>
<style scoped>
.btn {
  padding: 10px 12px;
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
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
