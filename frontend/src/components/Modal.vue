<template>
  <div v-if="visible" class="modal-wrap">
    <div class="backdrop" @click="close" />
    <div class="modal" ref="panel" tabindex="-1" @keydown.esc.prevent.stop="close">
      <header class="modal-header">
        <slot name="header"><h3 class="title">{{ title }}</h3></slot>
        <button class="close" @click="close" aria-label="Close"><i class="pi pi-times" /></button>
      </header>
      <div class="modal-body"><slot /></div>
      <footer class="modal-footer"><slot name="footer" /></footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps<{ visible: boolean; title?: string }>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()
const panel = ref<HTMLDivElement | null>(null)
function close() { emit('update:visible', false) }
watch(() => props.visible, (v) => { if (v) setTimeout(() => panel.value?.focus(), 0) })
</script>

<style scoped>
.modal-wrap { position: fixed; inset: 0; z-index: 60; }
.backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
.modal { position: absolute; left: 50%; top: 10vh; transform: translateX(-50%); width: min(720px, 92vw); background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--elev-3); display: flex; flex-direction: column; }
.modal-header, .modal-footer { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between; }
.modal-footer { border-top: 1px solid var(--color-border); border-bottom: none; }
.modal-body { padding: var(--space-4); max-height: 65vh; overflow: auto; }
.close { border: none; background: transparent; cursor: pointer; color: var(--color-text); }
</style>

