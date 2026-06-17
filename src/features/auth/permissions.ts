import type { AppPermission, UserRole } from './types'

const rolePermissionMap: Record<UserRole, AppPermission[]> = {
  admin: [
    'task:create',
    'task:edit',
    'task:delete',
    'task:status:update',
    'truck:view',
    'truck:batch',
    'user:manage',
  ],
  viewer: [],
}

export function getRolePermissions(role: UserRole | null | undefined) {
  if (!role) {
    return []
  }

  return rolePermissionMap[role]
}

export function matchesRole(role: UserRole | null | undefined, allowedRoles?: UserRole[]) {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true
  }

  if (!role) {
    return false
  }

  return allowedRoles.includes(role)
}

export function matchesPermissions(
  currentPermissions: AppPermission[],
  requiredPermissions?: AppPermission[],
) {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true
  }

  return requiredPermissions.every((permission) => currentPermissions.includes(permission))
}
