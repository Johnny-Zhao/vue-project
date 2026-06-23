import { createRouter, createWebHistory } from 'vue-router'
import { readStoredSession } from '@/features/auth/session'
import AppLayout from '@/layout/AppLayout.vue'
import { auditLogRoutes } from './modules/audit-log'
import { authRoutes } from './modules/auth'
import { systemRoutes } from './modules/system'
import { taskRoutes } from './modules/task'
import { truckRoutes } from './modules/truck'
import { vehicleRoutes } from './modules/vehicle'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    {
      path: '/',
      component: AppLayout,
      children: [
        ...taskRoutes,
        ...systemRoutes,
        ...truckRoutes,
        ...vehicleRoutes,
        ...auditLogRoutes,
      ],
    },
  ],
})

// 基于登录态和后端返回菜单控制路由访问。
router.beforeEach((to) => {
  const session = readStoredSession()
  const isAuthenticated = Boolean(session)
  const requiresAuth = to.meta.requiresAuth !== false
  const sessionMenus = Array.isArray(session?.menus) ? session.menus : []

  if (requiresAuth && !isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.meta.publicOnly && isAuthenticated) {
    return {
      name: 'home',
    }
  }

  if (
    isAuthenticated &&
    sessionMenus.length > 0 &&
    to.name &&
    to.name !== 'forbidden' &&
    to.name !== 'login' &&
    !sessionMenus.includes(String(to.name))
  ) {
    return {
      name: 'forbidden',
      query: {
        from: to.fullPath,
      },
    }
  }

  return true
})

export default router
