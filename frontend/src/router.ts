import { createRouter, createWebHistory } from 'vue-router'
import Login from './Login.vue'
import Dashboard from './Dashboard.vue'
import Certificates from './Certificates.vue'
import NewCertificate from './NewCertificate.vue'
import Collaborators from './Collaborators.vue'
import AppLayout from './layouts/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: Login, meta: { title: 'Login' } },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: Dashboard, meta: { title: 'Dashboard', breadcrumb: [{ label: 'Dashboard' }] } },
        { path: 'collaborators', name: 'collaborators', component: Collaborators, meta: { title: 'Colaboradores', breadcrumb: [{ label: 'Dashboard', to: '/' }, { label: 'Colaboradores' }] } },
        { path: 'certificates', name: 'certificates', component: Certificates, meta: { title: 'Atestados', breadcrumb: [{ label: 'Dashboard', to: '/' }, { label: 'Atestados' }] } },
        { path: 'certificates/new', name: 'new-certificate', component: NewCertificate, meta: { title: 'Novo Atestado', breadcrumb: [{ label: 'Dashboard', to: '/' }, { label: 'Atestados', to: '/certificates' }, { label: 'Novo' }] } },
      ],
    },
  ],
})

// mock auth guard (substituir por integração real ao backend)
router.beforeEach((to, _from, next) => {
  const authed = !!localStorage.getItem('token')
  if (to.meta.requiresAuth && !authed) next({ name: 'login' })
  else next()
})

export default router
