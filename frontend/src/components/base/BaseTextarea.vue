<template>
  <textarea
    :id="id"
    class="base-textarea"
    :rows="rows"
    :placeholder="placeholder"
    :maxlength="maxlength"
    :value="modelValue"
    @input="onInput"
  />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue: string; placeholder?: string; rows?: number; maxlength?: number; id?: string; autoResize?: boolean }>(), {
  rows: 4,
})
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
function onInput(e: Event) { emit('update:modelValue', (e.target as HTMLTextAreaElement).value) }
</script>

<style scoped>
.base-textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-2); color: var(--color-text); resize: vertical; }
</style>

