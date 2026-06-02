import { computed } from 'vue'
import { useAuthStore } from './store'
import type { AppPermission, UserRole } from './types'

type PermissionCheckInput =
  | AppPermission
  | AppPermission[]
  | {
      permissions?: AppPermission | AppPermission[]
      roles?: UserRole | UserRole[]
      mode?: 'all' | 'any'
    }

function normalizeArray<T>(value?: T | T[]) {
  if (value === undefined) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

export function usePermission() {
  const authStore = useAuthStore()

  function hasRole(roles: UserRole | UserRole[]) {
    return authStore.hasRole(roles)
  }

  function hasPermission(input: PermissionCheckInput) {
    if (typeof input === 'string' || Array.isArray(input)) {
      return authStore.hasPermission(input)
    }

    const requiredRoles = normalizeArray(input.roles)
    const requiredPermissions = normalizeArray(input.permissions)
    const mode = input.mode ?? 'all'

    const roleMatched = requiredRoles.length === 0 || authStore.hasRole(requiredRoles)

    const permissionMatched =
      requiredPermissions.length === 0
        ? true
        : mode === 'any'
          ? requiredPermissions.some((permission) => authStore.permissions.includes(permission))
          : authStore.hasPermission(requiredPermissions)

    return roleMatched && permissionMatched
  }

  return {
    role: computed(() => authStore.role),
    permissions: computed(() => authStore.permissions),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    hasRole,
    hasPermission,
  }
}
