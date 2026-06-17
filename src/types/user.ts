import type { KeywordQuery, PageQuery } from '@/types/query'
import type { UserRole } from '@/features/auth/types'

export type UserStatus = 'active' | 'disabled'

export interface UserItem {
  id: number
  username: string
  name: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface UserQuery extends KeywordQuery, PageQuery {
  role?: UserRole
  status?: UserStatus
  sortField?: keyof UserItem
  sortOrder?: 'asc' | 'desc'
}

export interface UserPageResult {
  list: UserItem[]
  total: number
  page: number
  pageSize: number
}

export interface CreateUserPayload {
  username: string
  password: string
  name: string
  role: UserRole
  status: UserStatus
}

export interface UpdateUserPayload {
  password?: string
  name?: string
  role?: UserRole
  status?: UserStatus
}
