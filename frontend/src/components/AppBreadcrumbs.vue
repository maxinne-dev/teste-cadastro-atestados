<template>
  <ol class="breadcrumbs">
    <li v-for="(item, idx) in items" :key="idx" class="crumb">
      <RouterLink v-if="item.to && idx < items.length - 1" :to="item.to">
        {{ item.label }}
      </RouterLink>
      <span v-else>{{ item.label }}</span>
    </li>
  </ol>
</template>

<script setup lang="ts">
defineProps<{ items: Array<{ label: string; to?: string }> }>()
</script>

<style scoped>
.breadcrumbs {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: var(--space-2);
  color: var(--color-text-secondary);
}
.crumb {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.crumb + .crumb::before {
  content: '/';
  color: var(--color-text-muted);
}
a {
  color: inherit;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
</style>
