<template>
  <header class="app-topbar elev-1">
    <button class="icon-btn" @click="onMenuClick" aria-label="Open menu" title="Menu">
      <i class="pi pi-bars" />
    </button>
    <div class="brand" @click="goHome" role="button" tabindex="0">
      <i class="pi pi-heart" />
      <span>Atestados</span>
    </div>
    <div class="grow" />
    <Button label="Novo Atestado" icon="pi pi-file-edit" class="p-button" @click="$emit('new-certificate')" />
    <button class="icon-btn" @click="toggleTheme" :aria-label="`Theme: ${theme}`" :title="`Theme: ${theme}`">
      <i class="pi" :class="theme === 'dark' ? 'pi-moon' : 'pi-sun'" />
    </button>
    <Menu ref="userMenu" :model="userItems" :popup="true" />
    <button class="user-btn" @click="toggleUserMenu" aria-haspopup="menu" aria-expanded="false">
      <Avatar icon="pi pi-user" shape="circle" />
      <span class="user-name">Usuário</span>
      <i class="pi pi-chevron-down" />
    </button>
  </header>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Avatar from 'primevue/avatar'

const router = useRouter()
const userMenu = ref()
const theme = ref<'light' | 'dark'>('light')

const userItems = [
  { label: 'Perfil (placeholder)', icon: 'pi pi-id-card', command: () => router.push({ name: 'dashboard' }) },
  { separator: true },
  { label: 'Sair', icon: 'pi pi-sign-out', command: () => emit('logout') },
]

const emit = defineEmits<{ (e: 'logout'): void; (e: 'toggle-sidebar'): void; (e: 'open-mobile-sidebar'): void }>()

function goHome() { router.push({ name: 'dashboard' }) }

function toggleUserMenu(event: Event) {
  userMenu.value?.toggle(event)
}

function onMenuClick() {
  if (window.innerWidth < 1024) emit('open-mobile-sidebar')
  else emit('toggle-sidebar')
}

function applyTheme(next: 'light' | 'dark') {
  theme.value = next
  const html = document.documentElement
  if (next === 'dark') html.setAttribute('data-theme', 'dark')
  else html.removeAttribute('data-theme')
  localStorage.setItem('theme', next)
}

function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

onMounted(() => {
  const saved = (localStorage.getItem('theme') as 'light' | 'dark' | null)
  if (saved) applyTheme(saved)
})
</script>

<style scoped>
.app-topbar {
  grid-area: topbar;
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-4);
  height: 56px;
  background: var(--color-surface-2);
  box-shadow: var(--elev-1);
  border-bottom: 1px solid var(--color-border);
}
.brand { display: inline-flex; align-items: center; gap: var(--space-2); font-weight: var(--font-weight-semibold); }
.brand i { color: var(--color-primary); }
.grow { flex: 1; }
.icon-btn { background: transparent; border: none; color: var(--color-text); height: 36px; width: 36px; border-radius: var(--radius-md); cursor: pointer; }
.icon-btn:hover { background: rgba(0,0,0,0.05); }
[data-theme="dark"] .icon-btn:hover { background: rgba(255,255,255,0.06); }
.user-btn { display: inline-flex; align-items: center; gap: var(--space-2); background: transparent; border: 1px solid var(--color-border); color: var(--color-text); padding: 4px 8px; border-radius: var(--radius-pill); cursor: pointer; }
.user-name { display: none; }
@media (min-width: 768px) { .user-name { display: inline; } }
</style>
