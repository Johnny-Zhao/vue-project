import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserPageResult,
  UserQuery,
  UserSortField,
  UserSortOrder,
  UserStatus,
} from '../types/user.ts'
import type { UserRole } from '../types/auth.ts'
import {
  createUser as createUserRecord,
  deleteUser as deleteUserRecord,
  findUserById,
  findUserByUsername,
  listUsers as listUserRecords,
  updateUser as updateUserRecord,
} from '../pg/repositories/user.repository.ts'
import { AppError } from '../utils/appError.ts'
import { hashPassword } from '../utils/password.ts'

const allowedRoles: UserRole[] = ['admin', 'viewer']
const allowedStatuses: UserStatus[] = ['active', 'disabled']
const allowedSortFields: UserSortField[] = [
  'id',
  'username',
  'name',
  'role',
  'status',
  'createdAt',
  'updatedAt',
]

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function parseUserId(rawId: unknown) {
  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('用户 id 必须是正整数。', 400)
  }

  return id
}

function parseRole(value: unknown): UserRole | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  return allowedRoles.includes(value as UserRole) ? (value as UserRole) : undefined
}

function parseStatus(value: unknown): UserStatus | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  return allowedStatuses.includes(value as UserStatus) ? (value as UserStatus) : undefined
}

function parseSortField(value: unknown): UserSortField | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  return allowedSortFields.includes(value as UserSortField) ? (value as UserSortField) : undefined
}

function parseSortOrder(value: unknown): UserSortOrder | undefined {
  if (value === 'asc' || value === 'desc') {
    return value
  }

  return undefined
}

export async function listUsers(filters: UserQuery = {}): Promise<UserPageResult> {
  const keyword = normalizeText(filters.keyword, 50)
  const role = parseRole(filters.role)
  const status = parseStatus(filters.status)
  const page = parsePositiveInt(filters.page, 1)
  const pageSize = Math.min(parsePositiveInt(filters.pageSize, 10), 50)
  const sortField = parseSortField(filters.sortField)
  const sortOrder = parseSortOrder(filters.sortOrder)

  const result = await listUserRecords({
    keyword,
    role,
    status,
    page,
    pageSize,
    sortField,
    sortOrder,
  })

  return {
    list: result.list,
    total: result.total,
    page,
    pageSize,
  }
}

export async function getUserDetail(rawId: unknown) {
  const id = parseUserId(rawId)
  const user = await findUserById(id)

  if (!user) {
    throw new AppError(`未找到 id 为 ${id} 的用户。`, 404)
  }

  return user
}

export async function createUser(payload: CreateUserPayload) {
  const username = normalizeText(payload.username, 30).toLowerCase()
  const password = normalizeText(payload.password, 100)
  const name = normalizeText(payload.name, 30)
  const role = parseRole(payload.role)
  const status = parseStatus(payload.status)

  if (!username) {
    throw new AppError('用户名不能为空。', 400)
  }

  if (!password) {
    throw new AppError('密码不能为空。', 400)
  }

  if (!name) {
    throw new AppError('姓名不能为空。', 400)
  }

  if (!role) {
    throw new AppError('角色只能是 admin 或 viewer。', 400)
  }

  if (!status) {
    throw new AppError('状态只能是 active 或 disabled。', 400)
  }

  const existingUser = await findUserByUsername(username)

  if (existingUser) {
    throw new AppError('用户名已存在。', 409)
  }

  const hashedPassword = await hashPassword(password)

  return createUserRecord({
    username,
    password: hashedPassword,
    name,
    role,
    status,
  })
}

export async function updateUser(rawId: unknown, payload: UpdateUserPayload) {
  const id = parseUserId(rawId)
  const currentUser = await findUserById(id)

  if (!currentUser) {
    throw new AppError(`未找到 id 为 ${id} 的用户。`, 404)
  }

  const name = payload.name === undefined ? undefined : normalizeText(payload.name, 30)
  const rawPassword =
    payload.password === undefined ? undefined : normalizeText(payload.password, 100)
  const role = payload.role === undefined ? undefined : parseRole(payload.role)
  const status = payload.status === undefined ? undefined : parseStatus(payload.status)

  if (name !== undefined && !name) {
    throw new AppError('姓名不能为空。', 400)
  }

  if (rawPassword !== undefined && !rawPassword) {
    throw new AppError('密码不能为空。', 400)
  }

  if (payload.role !== undefined && !role) {
    throw new AppError('角色只能是 admin 或 viewer。', 400)
  }

  if (payload.status !== undefined && !status) {
    throw new AppError('状态只能是 active 或 disabled。', 400)
  }

  const password = rawPassword ? await hashPassword(rawPassword) : undefined

  return updateUserRecord(id, {
    name,
    password,
    role,
    status,
  })
}

export async function removeUser(rawId: unknown) {
  const id = parseUserId(rawId)
  const deletedId = await deleteUserRecord(id)

  if (!deletedId) {
    throw new AppError(`未找到 id 为 ${id} 的用户。`, 404)
  }

  return {
    id: deletedId,
    deleted: true,
  }
}
