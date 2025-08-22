<template>
  <nav class="nav" role="navigation" aria-label="Main">
    <ul class="nav-list">
      <li>
        <RouterLink :to="{ name: 'dashboard' }" class="nav-item" :class="{ active: isActive('/') }" @click="$emit('navigate', '/')">
          <i class="pi pi-home" />
          <span v-if="!collapsed">Dashboard</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink :to="{ name: 'collaborators' }" class="nav-item" :class="{ active: isActive('/collaborators') }" @click="$emit('navigate', '/collaborators')">
          <i class="pi pi-users" />
          <span v-if="!collapsed">Colaboradores</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink :to="{ name: 'certificates' }" class="nav-item" :class="{ active: isActive('/certificates') }" @click="$emit('navigate', '/certificates')">
          <i class="pi pi-id-card" />
          <span v-if="!collapsed">Atestados</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink :to="{ name: 'new-certificate' }" class="nav-item" :class="{ active: isActive('/certificates/new') }" @click="$emit('navigate', '/certificates/new')">
          <i class="pi pi-file-edit" />
          <span v-if="!collapsed">Novo Atestado</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
defineProps<{ collapsed?: boolean }>()
const route = useRoute()
function isActive(path: string) {
  return route.path === path
}
</script>

<style scoped>
.nav { padding: 0 var(--space-2); }
.nav-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.nav-item { display: flex; align-items: center; gap: var(--space-3); color: var(--color-text); text-decoration: none; padding: 10px 12px; border-radius: var(--radius-md); }
.nav-item:hover { background: rgba(0,0,0,0.05); }
[data-theme="dark"] .nav-item:hover { background: rgba(255,255,255,0.06); }
.active { background: rgba(37,99,235,0.10); position: relative; }
.active::before { content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; background: var(--color-primary); border-radius: 2px; }
.nav-item i { width: 20px; text-align: center; }
</style>

