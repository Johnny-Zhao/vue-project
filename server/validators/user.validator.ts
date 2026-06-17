import type { BodyValidationResult } from '../types/http.ts'
import type { CreateUserPayload, UpdateUserPayload, UserStatus } from '../types/user.ts'
import type { UserRole } from '../types/auth.ts'
import { AppError } from '../utils/appError.ts'

const allowedRoles: UserRole[] = ['admin', 'viewer']
const allowedStatuses: UserStatus[] = ['active', 'disabled']

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

export function validateCreateUserPayload(body: unknown): BodyValidationResult<CreateUserPayload> {
  const source = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const username = normalizeText(source.username, 30).toLowerCase()
  const password = normalizeText(source.password, 100)
  const name = normalizeText(source.name, 30)
  const role = typeof source.role === 'string' ? source.role : 'viewer'
  const status = typeof source.status === 'string' ? source.status : 'active'

  if (!username) {
    return { valid: false, error: new AppError('用户名不能为空。', 400) }
  }

  if (!password) {
    return { valid: false, error: new AppError('密码不能为空。', 400) }
  }

  if (!name) {
    return { valid: false, error: new AppError('姓名不能为空。', 400) }
  }

  if (!allowedRoles.includes(role as UserRole)) {
    return { valid: false, error: new AppError('角色只能是 admin 或 viewer。', 400) }
  }

  if (!allowedStatuses.includes(status as UserStatus)) {
    return { valid: false, error: new AppError('状态只能是 active 或 disabled。', 400) }
  }

  return {
    valid: true,
    data: {
      username,
      password,
      name,
      role: role as UserRole,
      status: status as UserStatus,
    },
  }
}

export function validateUpdateUserPayload(body: unknown): BodyValidationResult<UpdateUserPayload> {
  const source = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const password = source.password === undefined ? undefined : normalizeText(source.password, 100)
  const name = source.name === undefined ? undefined : normalizeText(source.name, 30)
  const role = source.role === undefined ? undefined : source.role
  const status = source.status === undefined ? undefined : source.status

  if (password !== undefined && !password) {
    return { valid: false, error: new AppError('密码不能为空。', 400) }
  }

  if (name !== undefined && !name) {
    return { valid: false, error: new AppError('姓名不能为空。', 400) }
  }

  if (role !== undefined && !allowedRoles.includes(role as UserRole)) {
    return { valid: false, error: new AppError('角色只能是 admin 或 viewer。', 400) }
  }

  if (status !== undefined && !allowedStatuses.includes(status as UserStatus)) {
    return { valid: false, error: new AppError('状态只能是 active 或 disabled。', 400) }
  }

  return {
    valid: true,
    data: {
      password,
      name,
      role: role as UserRole | undefined,
      status: status as UserStatus | undefined,
    },
  }
}
