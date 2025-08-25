import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { getToken } from './services/token'
import Login from './Login.vue'
import Dashboard from './Dashboard.vue'
import Certificates from './Certificates.vue'
import NewCertificate from './NewCertificate.vue'
import Collaborators from './Collaborators.vue'
import AppLayout from './layouts/AppLayout.vue'
import NotFound from './NotFound.vue'

const router = createRouter({
  history:
    typeof window === 'undefined' || process.env.NODE_ENV === 'test'
      ? createMemoryHistory()
      : createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { title: 'Login' },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: Dashboard,
          meta: {
            title: 'Dashboard',
            breadcrumb: [{ label: 'Dashboard' }],
            roles: ['hr', 'admin'],
          },
        },
        {
          path: 'collaborators',
          name: 'collaborators',
          component: Collaborators,
          meta: {
            title: 'Colaboradores',
            breadcrumb: [
              { label: 'Dashboard', to: '/' },
              { label: 'Colaboradores' },
            ],
            roles: ['hr', 'admin'],
          },
        },
        {
          path: 'certificates',
          name: 'certificates',
          component: Certificates,
          meta: {
            title: 'Atestados',
            breadcrumb: [
              { label: 'Dashboard', to: '/' },
              { label: 'Atestados' },
            ],
            roles: ['hr', 'admin'],
          },
        },
        {
          path: 'certificates/new',
          name: 'new-certificate',
          component: NewCertificate,
          meta: {
            title: 'Novo Atestado',
            breadcrumb: [
              { label: 'Dashboard', to: '/' },
              { label: 'Atestados', to: '/certificates' },
              { label: 'Novo' },
            ],
            roles: ['hr', 'admin'],
          },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  ],
})

// auth guard using token presence
router.beforeEach((to, _from, next) => {
  const token = getToken()
  const authed = !!token
  console.log('Router guard:', { to: to.path, authed })
  
  if (to.meta.requiresAuth && !authed) {
    console.log('Redirecting to login - not authenticated')
    next({ name: 'login' })
  } else if (to.name === 'login' && authed) {
    console.log('Already authenticated, redirecting to dashboard')
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
