<template>
  <div class="empty-state">
    <i v-if="icon" class="pi" :class="icon" />
    <h3 class="title">{{ title }}</h3>
    <p class="desc" v-if="description">{{ description }}</p>
    <div class="actions"><slot name="actions" /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; description?: string; icon?: string }>()
</script>

<style scoped>
.empty-state { padding: var(--space-6); text-align: center; color: var(--color-text-secondary); display: grid; place-items: center; gap: var(--space-3); }
.title { margin: 0; }
.desc { margin: 0; }
</style>

