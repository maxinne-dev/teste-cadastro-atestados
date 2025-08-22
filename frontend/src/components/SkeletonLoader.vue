<template>
  <div v-for="i in lines" :key="i" class="skeleton" :style="{ height }" />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ lines?: number; height?: string }>(), {
  lines: 3,
  height: '12px',
})
</script>

<style scoped>
.skeleton {
  width: 100%;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.06),
    rgba(0, 0, 0, 0.08),
    rgba(0, 0, 0, 0.06)
  );
  border-radius: var(--radius-sm);
  margin: 6px 0;
}
[data-theme='dark'] .skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.06)
  );
}
</style>
