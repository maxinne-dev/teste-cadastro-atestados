<template>
  <footer class="app-footer container">
    <small>&copy; {{ year }} Atestados — Dummy UI</small>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
  color: var(--color-text-secondary);
  padding: var(--space-6) 0;
}
</style>
