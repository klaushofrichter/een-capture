import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getAuthUrl } from '../services/auth'
import securityService from '../services/security'

// Define our list of valid routes for easier checking
const validRoutes = ['home', 'about', 'profile', 'settings', 'direct', 'capture']

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/direct',
    name: 'Direct',
    component: () => import('../views/Direct.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/capture',
    name: 'Capture',
    component: () => import('../views/Capture.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    // Catch-all route for handling 404s
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})
console.log('router.base:', import.meta.env.BASE_URL)

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    console.log(`Authentication required for ${to.fullPath}. Redirecting to EEN login.`)

    // Check if the route is valid or invalid before redirecting to login
    const routePath = to.fullPath.split('?')[0] // Remove any query params
    const routeSegment = routePath.split('/')[1] // Get the first path segment after /
    const isValidRoute = validRoutes.includes(routeSegment)

    // Store whether the path is valid or not along with the path
    localStorage.setItem('redirectAfterLogin', to.fullPath)
    localStorage.setItem('isValidRoute', isValidRoute.toString())
    console.log('Storing redirect info - Path:', to.fullPath, 'Is valid:', isValidRoute)

    const eenAuthUrl = getAuthUrl()
    
    // Validate URL scheme before redirecting
    if (!securityService.validateUrlScheme(eenAuthUrl)) {
      console.error('🚫 Security: Blocked redirect to unsafe URL:', eenAuthUrl)
      next(false)
      return
    }
    
    window.location.assign(eenAuthUrl)
    next(false)
  } else {
    next()
  }
})

export default router
