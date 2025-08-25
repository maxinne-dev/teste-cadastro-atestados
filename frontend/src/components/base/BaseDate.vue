<template>
  <input
    :id="id"
    class="base-input"
    type="date"
    :min="minStr"
    :max="maxStr"
    :value="valueStr"
    @input="onInput"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  modelValue: string | Date | null
  placeholder?: string
  min?: string | Date
  max?: string | Date
  id?: string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: string | null): void
  (e: 'change', v: string | null): void
}>()

const toISODate = (v?: string | Date | null) => {
  if (!v) return ''
  const d = typeof v === 'string' ? new Date(v) : v
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}
const valueStr = computed(() => toISODate(props.modelValue))
const minStr = computed(() => toISODate(props.min ?? null))
const maxStr = computed(() => toISODate(props.max ?? null))

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value || null
  emit('update:modelValue', v)
  emit('change', v)
}
</script>

<style scoped>
.base-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
  color: var(--color-text);
}
</style>
