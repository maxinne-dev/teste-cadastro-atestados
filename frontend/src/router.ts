import { createRouter, createWebHistory } from 'vue-router'
import Login from './Login.vue'
import Dashboard from './Dashboard.vue'
import Certificates from './Certificates.vue'
import NewCertificate from './NewCertificate.vue'
import Collaborators from './Collaborators.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: Login },
    { path: '/', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/certificates', name: 'certificates', component: Certificates, meta: { requiresAuth: true } },
    { path: '/certificates/new', name: 'new-certificate', component: NewCertificate, meta: { requiresAuth: true } },
    { path: '/collaborators', name: 'collaborators', component: Collaborators, meta: { requiresAuth: true } },
  ],
})

// mock auth guard (substituir por integração real ao backend)
router.beforeEach((to, _from, next) => {
  const authed = !!localStorage.getItem('token')
  if (to.meta.requiresAuth && !authed) next({ name: 'login' })
  else next()
})

export default router
