<template>
  <div v-if="visible" class="modal-wrap" aria-hidden="false">
    <div class="backdrop" @click="close" />
    <div
      ref="panel"
      class="modal"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="bodyId"
      @keydown.esc.prevent.stop="close"
      @keydown.prevent="onKeydown"
    >
      <header class="modal-header">
        <slot name="header">
          <h3 :id="titleId" class="title">
            {{ title }}
          </h3>
        </slot>
        <button class="close" aria-label="Fechar" @click="close">
          <i class="pi pi-times" />
        </button>
      </header>
      <div :id="bodyId" class="modal-body">
        <slot />
      </div>
      <footer class="modal-footer">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
const props = defineProps<{ visible: boolean; title?: string }>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()
const panel = ref<HTMLDivElement | null>(null)
const titleId = `modal-title-${Math.random().toString(36).slice(2)}`
const bodyId = `modal-body-${Math.random().toString(36).slice(2)}`
function close() {
  emit('update:visible', false)
}
watch(
  () => props.visible,
  (v) => {
    if (v) setTimeout(() => panel.value?.focus(), 0)
  },
)

function getFocusable(): HTMLElement[] {
  const root = panel.value
  if (!root) return []
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ]
  // In some environments (e.g., jsdom), offsetParent is not reliable.
  // Return all candidates; callers can handle visibility if needed.
  return Array.from(root.querySelectorAll<HTMLElement>(selectors.join(',')))
}
function onTab(e: KeyboardEvent) {
  const nodes = getFocusable()
  if (!nodes.length) return
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  const active = document.activeElement as HTMLElement | null
  if (e.shiftKey) {
    if (!active || active === first) last.focus()
    else return
  } else {
    if (!active || active === last) first.focus()
    else return
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    e.stopPropagation()
    onTab(e)
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown, true)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown, true)
})
</script>

<style scoped>
.modal-wrap {
  position: fixed;
  inset: 0;
  z-index: 9997;
}
.backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}
.modal {
  position: absolute;
  left: 50%;
  top: 10vh;
  transform: translateX(-50%);
  width: min(720px, 92vw);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--elev-3);
  display: flex;
  flex-direction: column;
}
.modal-header,
.modal-footer {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-footer {
  border-top: 1px solid var(--color-border);
  border-bottom: none;
}
.modal-body {
  padding: var(--space-4);
  max-height: 65vh;
  overflow: auto;
}
.close {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-text);
}
</style>
