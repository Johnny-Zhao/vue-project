import { createRouter, createWebHistory } from 'vue-router'
import { readStoredSession } from '@/features/auth/session'
import { getRolePermissions, matchesPermissions, matchesRole } from '@/features/auth/permissions'
import { authRoutes } from './modules/auth'
import { systemRoutes } from './modules/system'
import { taskRoutes } from './modules/task'
import { truckRoutes } from './modules/truck'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...authRoutes, ...taskRoutes, ...systemRoutes, ...truckRoutes],
})

router.beforeEach((to) => {
  const session = readStoredSession()
  const isAuthenticated = Boolean(session)
  const requiresAuth = to.meta.requiresAuth !== false
  const userRole = session?.user.role
  const userPermissions = getRolePermissions(userRole)

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
    (!matchesRole(userRole, to.meta.roles) || !matchesPermissions(userPermissions, to.meta.permissions))
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
