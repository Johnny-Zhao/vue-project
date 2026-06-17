import { requestApi } from '@/api/request'
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserItem,
  UserPageResult,
  UserQuery,
} from '@/types/user'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export function fetchUsersApi(params?: UserQuery) {
  return requestApi<UserPageResult>({
    url: '/users',
    method: 'GET',
    params,
    baseURL: API_BASE_URL,
  })
}

export function createUserApi(payload: CreateUserPayload) {
  return requestApi<UserItem, CreateUserPayload>({
    url: '/users',
    method: 'POST',
    data: payload,
    baseURL: API_BASE_URL,
  })
}

export function updateUserApi(id: number, payload: UpdateUserPayload) {
  return requestApi<UserItem, UpdateUserPayload>({
    url: `/users/${id}`,
    method: 'PUT',
    data: payload,
    baseURL: API_BASE_URL,
  })
}

export function deleteUserApi(id: number) {
  return requestApi<{ id: number; deleted: boolean }>({
    url: `/users/${id}`,
    method: 'DELETE',
    baseURL: API_BASE_URL,
  })
}
