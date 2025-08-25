<template>
  <input
    :id="id"
    class="base-input"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :autocomplete="autocomplete"
    :maxlength="maxlength"
    :value="modelValue"
    @input="onInput"
    @blur="$emit('blur', $event)"
    @focus="$emit('focus', $event)"
  >
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    type?: 'text' | 'email' | 'tel' | 'number'
    autocomplete?: string
    id?: string
    maxlength?: number
  }>(),
  {
    type: 'text',
  },
)
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'blur', ev: FocusEvent): void
  (e: 'focus', ev: FocusEvent): void
}>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<style>
.base-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
  color: var(--color-text);
}
.base-input:focus {
  outline: var(--focus-width) solid var(--focus-color);
  outline-offset: 2px;
}
</style>
