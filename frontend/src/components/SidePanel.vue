<template>
  <div v-if="visible" class="panel-wrap" @keyup.esc="close" tabindex="-1">
    <div class="backdrop" @click="close" />
    <aside class="panel" :class="position">
      <header class="panel-header">
        <slot name="header"><h3 class="title">{{ title }}</h3></slot>
        <button class="close" @click="close" aria-label="Close">
          <i class="pi pi-times" />
        </button>
      </header>
      <div class="panel-body"><slot /></div>
      <footer class="panel-footer"><slot name="footer" /></footer>
    </aside>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ visible: boolean; title?: string; position?: 'right' | 'left'; width?: string }>(), {
  position: 'right',
  width: '420px',
})
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()
function close() { emit('update:visible', false) }
</script>

<style scoped>
.panel-wrap { position: fixed; inset: 0; z-index: 40; }
.backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
.panel { position: absolute; top: 0; bottom: 0; width: v-bind(width); background: var(--color-surface-2); border-left: 1px solid var(--color-border); border-right: 1px solid var(--color-border); box-shadow: var(--elev-3); display: flex; flex-direction: column; }
.panel.right { right: 0; }
.panel.left { left: 0; }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
.panel-body { padding: var(--space-4); overflow: auto; }
.panel-footer { padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-border); }
.close { border: none; background: transparent; cursor: pointer; color: var(--color-text); }
</style>

