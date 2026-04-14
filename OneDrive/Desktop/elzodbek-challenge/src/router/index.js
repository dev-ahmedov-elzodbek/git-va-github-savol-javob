import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  { path: '/', redirect: '/today' },
  { path: '/auth', component: () => import('../views/AuthView.vue') },

  // === ADMIN (faqat role: 'admin') ===
  { path: '/admin-login', component: () => import('../views/AdminLoginView.vue') },
  { path: '/admin', component: () => import('../views/AdminView.vue'), meta: { auth: true, role: 'admin' } },

  // === SUPERADMIN (faqat role: 'superadmin') ===
  { path: '/superadmin-login', component: () => import('../views/SuperAdminLoginView.vue') },
  { path: '/superadmin', component: () => import('../views/SuperAdminView.vue'), meta: { auth: true, role: 'superadmin' } },

  // === ODDIY FOYDALANUVCHI ===
  { path: '/onboarding', component: () => import('../views/OnboardingView.vue') },
  { path: '/today', component: () => import('../views/TodayView.vue') },
  { path: '/calendar', component: () => import('../views/CalendarView.vue') },
  { path: '/stats', component: () => import('../views/StatsView.vue') },
  { path: '/schedule', component: () => import('../views/ScheduleView.vue') },
  { path: '/nutrition', component: () => import('../views/NutritionView.vue') },
  { path: '/profile', component: () => import('../views/ProfileView.vue'), meta: { auth: true } },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  let waited = 0
  while (auth.loading && waited < 3000) {
    await new Promise(r => setTimeout(r, 50))
    waited += 50
  }

  const role = auth.profile?.role

  // Login kerak, kirmagan
  if (to.meta.auth && !auth.isLoggedIn) {
    if (to.meta.role === 'superadmin') return '/superadmin-login'
    if (to.meta.role === 'admin') return '/admin-login'
    return '/auth'
  }

  // SuperAdmin sahifasi — faqat superadmin
  if (to.meta.role === 'superadmin' && role !== 'superadmin') {
    return auth.isLoggedIn ? '/today' : '/superadmin-login'
  }

  // Admin sahifasi — faqat admin (superadmin o'z sahifasiga)
  if (to.meta.role === 'admin' && role !== 'admin') {
    if (role === 'superadmin') return '/superadmin'
    return auth.isLoggedIn ? '/today' : '/admin-login'
  }

  // Onboarding — admin/superadmin uchun shart emas
  if (auth.isLoggedIn && auth.needsOnboarding && to.path !== '/onboarding') {
    if (!['admin', 'superadmin'].includes(role)) return '/onboarding'
  }

  // Kirgan foydalanuvchi login sahifalariga kira olmasin
  if (auth.isLoggedIn) {
    if (to.path === '/auth') return '/today'
    if (to.path === '/admin-login' && role === 'admin') return '/admin'
    if (to.path === '/superadmin-login' && role === 'superadmin') return '/superadmin'
  }

  return true
})
