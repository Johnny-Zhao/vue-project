import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loginApi } from './api'
import { getRolePermissions } from './permissions'
import { clearStoredSession, isSessionExpired, persistSession, readStoredSession } from './session'
import type { AppPermission, LoginPayload, UserRole } from './types'

export const useAuthStore = defineStore('auth', () => {
  const session = ref(readStoredSession())

  const user = computed(() => session.value?.user ?? null)
  const token = computed(() => session.value?.accessToken ?? '')
  const role = computed<UserRole | null>(() => session.value?.user.role ?? null)
  const permissions = computed<AppPermission[]>(() => getRolePermissions(role.value))
  const isAuthenticated = computed(() => Boolean(session.value))

  function hydrateSession() {
    const nextSession = readStoredSession()
    if (nextSession && isSessionExpired(nextSession)) {
      logout()
      return
    }

    session.value = nextSession
  }

  async function login(payload: LoginPayload) {
    const nextSession = await loginApi(payload)
    persistSession(nextSession, payload.remember)
    session.value = nextSession
    return nextSession
  }

  function logout() {
    clearStoredSession()
    session.value = null
  }

  function hasRole(allowedRoles: UserRole | UserRole[]) {
    const normalizedRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    return role.value !== null && normalizedRoles.includes(role.value)
  }

  function hasPermission(requiredPermissions: AppPermission | AppPermission[]) {
    const normalizedPermissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions]

    return normalizedPermissions.every((permission) => permissions.value.includes(permission))
  }

  return {
    session,
    user,
    token,
    role,
    permissions,
    isAuthenticated,
    hydrateSession,
    login,
    logout,
    hasRole,
    hasPermission,
  }
})
