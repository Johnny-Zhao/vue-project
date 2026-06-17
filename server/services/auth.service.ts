import { env } from '../config/env.ts'
import type {
  AppPermission,
  AuthSession,
  AuthenticatedUser,
  JwtPayload,
  LoginRequestBody,
  UserRole,
} from '../types/auth.ts'
import {
  findUserById,
  findUserByUsername,
  updateUserPassword,
} from '../pg/repositories/user.repository.ts'
import { AppError } from '../utils/appError.ts'
import { signJwt, verifyJwt } from '../utils/jwt.ts'
import { hashPassword, isHashedPassword, verifyPassword } from '../utils/password.ts'

const rolePermissionMap: Record<UserRole, AppPermission[]> = {
  admin: [
    'task:create',
    'task:edit',
    'task:delete',
    'task:status:update',
    'truck:view',
    'truck:batch',
    'user:manage',
  ],
  viewer: [],
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

export function getRolePermissions(role: UserRole) {
  return rolePermissionMap[role]
}

export function buildAuthenticatedUser(payload: JwtPayload): AuthenticatedUser {
  return {
    id: payload.sub,
    username: payload.username,
    name: payload.name,
    role: payload.role,
    permissions: getRolePermissions(payload.role),
  }
}

function buildAuthSession(user: {
  id: number
  username: string
  name: string
  role: UserRole
}): AuthSession {
  const signed = signJwt(
    {
      sub: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    env.authJwtSecret,
    env.authJwtExpiresMinutes,
  )

  return {
    accessToken: signed.token,
    refreshToken: '',
    expiresAt: signed.expiresAt,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  }
}

export async function authenticateUser(payload: LoginRequestBody): Promise<AuthSession> {
  const username = payload.username.trim()
  const password = payload.password.trim()

  if (!username || !password) {
    throw new AppError('请输入用户名和密码。', 400)
  }

  const account = await findUserByUsername(normalizeUsername(username))

  if (!account) {
    throw new AppError('用户名或密码错误。', 401)
  }

  const passwordMatched = await verifyPassword(password, account.password)

  if (!passwordMatched) {
    throw new AppError('用户名或密码错误。', 401)
  }

  if (account.status !== 'active') {
    throw new AppError('当前账号已被禁用。', 403)
  }

  if (!isHashedPassword(account.password)) {
    const nextPassword = await hashPassword(password)
    await updateUserPassword(Number(account.id), nextPassword)
  }

  return buildAuthSession({
    id: Number(account.id),
    username: account.username,
    name: account.name,
    role: account.role,
  })
}

export async function verifyAccessToken(token: string) {
  const payload = verifyJwt(token, env.authJwtSecret)

  if (!payload) {
    throw new AppError('登录状态无效，请重新登录。', 401)
  }

  const dbUser = await findUserById(payload.sub)

  if (!dbUser) {
    throw new AppError('当前登录用户不存在。', 401)
  }

  if (dbUser.status !== 'active') {
    throw new AppError('当前账号已被禁用。', 403)
  }

  return buildAuthenticatedUser({
    ...payload,
    username: payload.username,
    name: dbUser.name,
    role: dbUser.role,
  })
}

export async function getCurrentAuthSession(token: string): Promise<AuthSession> {
  const authUser = await verifyAccessToken(token)

  return buildAuthSession({
    id: authUser.id,
    username: authUser.username,
    name: authUser.name,
    role: authUser.role,
  })
}
