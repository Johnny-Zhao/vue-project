import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchCurrentSessionApi, loginApi } from './api'
import { getRolePermissions } from './permissions'
import {
  clearStoredSession,
  getStoredSessionPersistence,
  isSessionExpired,
  persistSession,
  readStoredSession,
} from './session'
import type { AppPermission, AuthSession, LoginPayload, UserRole } from './types'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(readStoredSession())
  const sessionRemember = ref(false)
  const sessionHydrated = ref(false)

  const user = computed(() => session.value?.user ?? null)
  const token = computed(() => session.value?.accessToken ?? '')
  const menus = computed(() => session.value?.menus ?? [])
  const role = computed<UserRole | null>(() => session.value?.user.role ?? null)
  const permissions = computed<AppPermission[]>(() => getRolePermissions(role.value))
  const isAuthenticated = computed(() => Boolean(session.value))

  // Update the in-memory and persisted session state.
  function updateSession(nextSession: AuthSession | null, remember = sessionRemember.value) {
    session.value = nextSession

    if (nextSession) {
      sessionRemember.value = remember
      persistSession(nextSession, remember)
      return
    }

    sessionRemember.value = false
    clearStoredSession()
  }

  // Restore the local session and verify it with the backend.
  async function hydrateSession() {
    const nextSession = readStoredSession()

    if (!nextSession || isSessionExpired(nextSession)) {
      updateSession(null, false)
      sessionHydrated.value = true
      return
    }

    session.value = nextSession
    sessionRemember.value = getStoredSessionPersistence() === 'local'

    try {
      const verifiedSession = await fetchCurrentSessionApi()
      updateSession(verifiedSession, sessionRemember.value)
    } catch {
      updateSession(null, false)
    } finally {
      sessionHydrated.value = true
    }
  }

  // Perform login and persist the returned session.
  async function login(payload: LoginPayload) {
    const nextSession = await loginApi(payload)
    updateSession(nextSession, payload.remember)
    return nextSession
  }

  // Clear the current authenticated session.
  function logout() {
    updateSession(null, false)
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
    menus,
    role,
    permissions,
    isAuthenticated,
    sessionHydrated,
    hydrateSession,
    login,
    logout,
    hasRole,
    hasPermission,
  }
})
