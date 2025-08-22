<template>
  <div class="banner" :class="severity">
    <i class="pi" :class="iconFor(severity)" />
    <div class="content">
      <div class="title">{{ title }}</div>
      <div class="desc"><slot>{{ description }}</slot></div>
    </div>
    <button v-if="closable" class="close" @click="$emit('close')" aria-label="Fechar"><i class="pi pi-times" /></button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ severity?: 'info' | 'success' | 'warn' | 'error'; title: string; description?: string; closable?: boolean }>()
function iconFor(s: any) { return s === 'success' ? 'pi-check-circle' : s === 'warn' ? 'pi-exclamation-triangle' : s === 'error' ? 'pi-times-circle' : 'pi-info-circle' }
</script>

<style scoped>
.banner { display: grid; grid-template-columns: 20px 1fr auto; gap: var(--space-3); align-items: start; padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface-2); }
.info { border-color: var(--color-info); }
.success { border-color: var(--color-success); }
.warn { border-color: var(--color-warning); }
.error { border-color: var(--color-error); }
.title { font-weight: var(--font-weight-medium); }
.desc { color: var(--color-text-secondary); }
.close { border: none; background: transparent; cursor: pointer; color: var(--color-text); }
</style>

