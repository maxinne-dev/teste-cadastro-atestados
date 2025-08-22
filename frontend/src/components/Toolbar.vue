<template>
  <div class="toolbar"><slot /></div>
</template>

<script setup lang="ts"></script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
</style>

