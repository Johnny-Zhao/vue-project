import { requestApi } from '@/api/request'
import type { AuthSession, LoginPayload } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function loginApi(payload: LoginPayload) {
  return requestApi<AuthSession, { username: string; password: string }>({
    url: '/auth/login',
    method: 'POST',
    data: {
      username: payload.username,
      password: payload.password,
    },
    baseURL: API_BASE_URL,
    auth: false,
  })
}

export async function fetchCurrentSessionApi() {
  return requestApi<AuthSession>({
    url: '/auth/me',
    method: 'GET',
    baseURL: API_BASE_URL,
  })
}
