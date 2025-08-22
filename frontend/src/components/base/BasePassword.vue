<template>
  <div class="password-wrap">
    <input
      :id="id"
      class="base-input"
      :type="visible ? 'text' : 'password'"
      :placeholder="placeholder"
      :value="modelValue"
      @input="onInput"
    />
    <button type="button" class="toggle" @click="visible = !visible" :aria-label="visible ? 'Hide password' : 'Show password'">
      <i class="pi" :class="visible ? 'pi-eye-slash' : 'pi-eye'" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ modelValue: string; placeholder?: string; id?: string; toggle?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
const visible = ref(false)
function onInput(e: Event) { emit('update:modelValue', (e.target as HTMLInputElement).value) }
</script>

<style scoped>
.password-wrap { position: relative; }
.base-input { width: 100%; padding: 10px 36px 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-2); color: var(--color-text); }
.toggle { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); border: none; background: transparent; cursor: pointer; color: var(--color-text); }
</style>

