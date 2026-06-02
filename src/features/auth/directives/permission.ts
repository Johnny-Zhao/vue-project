import type { App, Directive, DirectiveBinding } from 'vue'
import { useAuthStore } from '../store'
import { pinia } from '@/stores/pinia'
import type { AppPermission, UserRole } from '../types'

type PermissionBindingValue =
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

function hasRequiredPermissions(
  currentPermissions: AppPermission[],
  requiredPermissions: AppPermission[],
  mode: 'all' | 'any',
) {
  if (requiredPermissions.length === 0) {
    return true
  }

  if (mode === 'any') {
    return requiredPermissions.some((permission) => currentPermissions.includes(permission))
  }

  return requiredPermissions.every((permission) => currentPermissions.includes(permission))
}

function resolveVisibility(value: PermissionBindingValue) {
  const authStore = useAuthStore(pinia)
  const currentRole = authStore.role
  const currentPermissions = authStore.permissions

  if (typeof value === 'string' || Array.isArray(value)) {
    return hasRequiredPermissions(currentPermissions, normalizeArray(value), 'all')
  }

  const requiredRoles = normalizeArray(value.roles)
  const requiredPermissions = normalizeArray(value.permissions)
  const mode = value.mode ?? 'all'

  const roleMatched =
    requiredRoles.length === 0 ? true : currentRole !== null && requiredRoles.includes(currentRole)

  const permissionMatched = hasRequiredPermissions(currentPermissions, requiredPermissions, mode)

  return roleMatched && permissionMatched
}

function applyVisibility(el: HTMLElement, binding: DirectiveBinding<PermissionBindingValue>) {
  const isVisible = resolveVisibility(binding.value)
  el.style.display = isVisible ? '' : 'none'
}

const permissionDirective: Directive<HTMLElement, PermissionBindingValue> = {
  mounted(el, binding) {
    applyVisibility(el, binding)
  },
  updated(el, binding) {
    applyVisibility(el, binding)
  },
}

export function installPermissionDirective(app: App) {
  app.directive('permission', permissionDirective)
}
