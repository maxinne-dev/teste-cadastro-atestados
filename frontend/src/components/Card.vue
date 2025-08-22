<template>
  <div class="card"><slot /></div>
</template>

<script setup lang="ts"></script>

<style scoped>
.card { padding: var(--space-4); background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
</style>

