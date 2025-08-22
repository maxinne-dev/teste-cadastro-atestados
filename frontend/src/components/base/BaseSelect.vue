<template>
  <select :id="id" class="base-select" :value="modelValue ?? ''" @change="onChange">
    <option v-if="placeholder" disabled value="">{{ placeholder }}</option>
    <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option>
  </select>
</template>

<script setup lang="ts">
type Opt = { label: string; value: string | number }
const props = defineProps<{ modelValue: string | number | null; options: Opt[]; placeholder?: string; id?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string | number | null): void; (e: 'change', v: string | number | null): void }>()
function onChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  emit('update:modelValue', val === '' ? null : (isNaN(Number(val)) ? val : (Number.isNaN(Number(val)) ? val : (Number(val) as any))))
  emit('change', val === '' ? null : (isNaN(Number(val)) ? val : Number(val)))
}
</script>

<style scoped>
.base-select { width: 100%; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-2); color: var(--color-text); }
</style>

