import type { UserRole } from './auth.ts'

export type UserStatus = 'active' | 'disabled'
export type UserSortField =
  | 'id'
  | 'username'
  | 'name'
  | 'role'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
export type UserSortOrder = 'asc' | 'desc'

export interface UserEntity {
  id: number
  username: string
  name: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface UserRow {
  id: number | string
  username: string
  name: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface UserQueryRow extends UserRow {
  password: string
}

export interface UserQuery {
  keyword?: string
  role?: UserRole
  status?: UserStatus
  page?: number | string
  pageSize?: number | string
  sortField?: UserSortField
  sortOrder?: UserSortOrder
}

export interface UserFilters {
  keyword: string
  role?: UserRole
  status?: UserStatus
  page: number
  pageSize: number
  sortField?: UserSortField
  sortOrder?: UserSortOrder
}

export interface UserListQuery {
  whereClause: string
  orderByClause: string
  values: unknown[]
}

export interface UserPageResult {
  list: UserEntity[]
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
