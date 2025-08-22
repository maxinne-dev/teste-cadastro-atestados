<template>
  <div v-if="visible" class="backdrop" @click.self="onCancel">
    <div class="dialog" :class="severity" ref="dialog" tabindex="-1" role="dialog" aria-modal="true" @keydown.esc.prevent.stop="onCancel">
      <h3 class="title">{{ title }}</h3>
      <p v-if="message" class="message">{{ message }}</p>
      <div class="actions">
        <button class="btn cancel" @click="onCancel">{{ cancelLabel }}</button>
        <button class="btn confirm" @click="onConfirm">{{ confirmLabel }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
const props = withDefaults(defineProps<{ visible: boolean; title: string; message?: string; confirmLabel?: string; cancelLabel?: string; severity?: 'neutral' | 'danger' }>(), {
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  severity: 'neutral',
})
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'confirm'): void; (e: 'cancel'): void }>()
const dialog = ref<HTMLDivElement | null>(null)
watch(() => props.visible, (v) => { if (v) setTimeout(() => dialog.value?.focus(), 0) })
function onCancel() { emit('update:visible', false); emit('cancel') }
function onConfirm() { emit('update:visible', false); emit('confirm') }
</script>

<style scoped>
.backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: grid; place-items: center; z-index: 50; }
.dialog { width: min(480px, 90vw); background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-5); box-shadow: var(--elev-3); }
.title { margin: 0 0 var(--space-3); }
.message { margin: 0 0 var(--space-5); color: var(--color-text-secondary); }
.actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
.btn { padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; }
.confirm { background: var(--color-primary); color: white; border: 1px solid var(--color-primary); }
.dialog.danger .confirm { background: var(--color-error); border-color: var(--color-error); }
</style>
