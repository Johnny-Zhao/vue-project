import type { AuthSession } from './types'

const LOCAL_SESSION_KEY = 'vue-project.auth.local-session'
const SESSION_SESSION_KEY = 'vue-project.auth.session-session'

function getStorageEntries() {
  if (typeof window === 'undefined') {
    return []
  }

  return [window.sessionStorage, window.localStorage] as const
}

function parseSession(rawValue: string | null): AuthSession | null {
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as AuthSession
  } catch {
    return null
  }
}

export function isSessionExpired(session: AuthSession) {
  return session.expiresAt <= Date.now()
}

export function readStoredSession(): AuthSession | null {
  for (const storage of getStorageEntries()) {
    const session = parseSession(
      storage === window.sessionStorage
        ? storage.getItem(SESSION_SESSION_KEY)
        : storage.getItem(LOCAL_SESSION_KEY),
    )

    if (!session) {
      continue
    }

    if (isSessionExpired(session)) {
      clearStoredSession()
      return null
    }

    return session
  }

  return null
}

export function persistSession(session: AuthSession, remember: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  clearStoredSession()

  const storage = remember ? window.localStorage : window.sessionStorage
  const storageKey = remember ? LOCAL_SESSION_KEY : SESSION_SESSION_KEY
  storage.setItem(storageKey, JSON.stringify(session))
}

export function clearStoredSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(LOCAL_SESSION_KEY)
  window.sessionStorage.removeItem(SESSION_SESSION_KEY)
}

export function getAccessToken() {
  return readStoredSession()?.accessToken ?? null
}
