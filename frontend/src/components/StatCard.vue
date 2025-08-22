<template>
  <div class="stat-card">
    <div class="icon" v-if="icon"><i class="pi" :class="icon" /></div>
    <div class="content">
      <div class="title">{{ title }}</div>
      <div class="value">{{ value }}</div>
      <div v-if="delta" class="delta" :class="severity">{{ delta }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ icon?: string; title: string; value: string | number; delta?: string; severity?: 'neutral' | 'success' | 'warning' | 'danger' }>()
</script>

<style scoped>
.stat-card { display: flex; gap: var(--space-3); padding: var(--space-4); background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.title { color: var(--color-text-secondary); font-size: var(--fs-caption); }
.value { font-size: var(--fs-h3); font-weight: var(--font-weight-semibold); }
.delta.neutral { color: var(--color-text-secondary); }
.delta.success { color: var(--color-success); }
.delta.warning { color: var(--color-warning); }
.delta.danger { color: var(--color-error); }
</style>

