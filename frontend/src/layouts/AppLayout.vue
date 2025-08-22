<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': collapsed }">
    <AppTopbar
      :collapsed="collapsed"
      @toggle-sidebar="toggleCollapse"
      @open-mobile-sidebar="() => (mobileSidebarVisible = true)"
      @new-certificate="goNewCertificate"
      @logout="logout"
    />

    <!-- Desktop sidebar -->
    <aside class="app-sidebar" aria-label="Main Navigation">
      <AppSidebar :collapsed="collapsed" @navigate="onNavigate" />
    </aside>

    <!-- Mobile sidebar overlay -->
    <Drawer
      v-model:visible="mobileSidebarVisible"
      position="left"
      :modal="true"
      :show-close-icon="true"
      :dismissable="true"
      :block-scroll="true"
    >
      <AppSidebar
        :collapsed="false"
        @navigate="() => (mobileSidebarVisible = false)"
      />
    </Drawer>

    <main id="content" class="app-content">
      <header class="page-header container">
        <div>
          <h1 class="page-title">
            {{ pageTitle }}
          </h1>
          <p v-if="pageSubtitle" class="page-subtitle">
            {{ pageSubtitle }}
          </p>
        </div>
        <div class="page-actions">
          <slot name="page-actions" />
        </div>
      </header>
      <nav
        v-if="breadcrumbItems.length"
        aria-label="Breadcrumb"
        class="container mt-4"
      >
        <AppBreadcrumbs :items="breadcrumbItems" />
      </nav>
      <section class="container mt-4">
        <router-view />
      </section>
      <AppFooter class="mt-4" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Drawer from 'primevue/drawer'
import AppTopbar from '../components/AppTopbar.vue'
import AppSidebar from '../components/AppSidebar.vue'
import AppBreadcrumbs from '../components/AppBreadcrumbs.vue'
import AppFooter from '../components/AppFooter.vue'

const router = useRouter()
const route = useRoute()

const mobileSidebarVisible = ref(false)
const collapsed = ref(false)

onMounted(() => {
  const persisted = localStorage.getItem('sidebar:collapsed')
  if (persisted) collapsed.value = persisted === 'true'
})

function toggleCollapse() {
  collapsed.value = !collapsed.value
  localStorage.setItem('sidebar:collapsed', String(collapsed.value))
}

function onNavigate(to?: string) {
  if (to) router.push(to)
}

function logout() {
  localStorage.removeItem('token')
  router.push({ name: 'login' })
}

function goNewCertificate() {
  router.push({ name: 'new-certificate' })
}

const pageTitle = computed(() => (route.meta?.title as string) || '')
const pageSubtitle = computed(() => (route.meta?.subtitle as string) || '')
const breadcrumbItems = computed(
  () => (route.meta?.breadcrumb as Array<{ label: string; to?: string }>) || [],
)
</script>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 56px 1fr;
  grid-template-areas:
    'topbar topbar'
    'sidebar content';
  min-height: 100vh;
  background: var(--color-bg);
}
.app-shell.sidebar-collapsed {
  grid-template-columns: 64px 1fr;
}

/* Regions */
:deep(.app-topbar) {
  grid-area: topbar;
}
.app-sidebar {
  grid-area: sidebar;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  padding: var(--space-4) 0;
}
.app-content {
  grid-area: content;
  background: var(--color-bg);
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  padding-top: var(--space-4);
}
.page-title {
  margin: 0;
}
.page-subtitle {
  color: var(--color-text-secondary);
  margin: 0;
}
.page-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* Responsive */
@media (max-width: 1023px) {
  .app-shell,
  .app-shell.sidebar-collapsed {
    grid-template-columns: 1fr;
    grid-template-rows: 56px auto 1fr;
    grid-template-areas:
      'topbar'
      'content'
      'content';
  }
  .app-sidebar {
    display: none;
  }
}
</style>
