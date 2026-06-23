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
    'ai:config',
    'user:manage',
  ],
  viewer: [],
}

const defaultMenuKeys = [
  'home',
  'taskCreate',
  'expressPlayground',
  'sqliteCrudPlayground',
  'postgresqlCrudPlayground',
  'truckList',
  'vehicleManagement',
  'aiConfigManagement',
  'auditLogManagement',
  'userManagement',
  'about',
]

// Normalize usernames so login lookups stay stable.
function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

// Resolve role-based permissions for the current account.
export function getRolePermissions(role: UserRole) {
  return rolePermissionMap[role]
}

// Current version returns every page and leaves real filtering for a later step.
function getAccessibleMenus() {
  return [...defaultMenuKeys]
}

// Build the authenticated user shape stored on the request context.
export function buildAuthenticatedUser(payload: JwtPayload): AuthenticatedUser {
  return {
    id: payload.sub,
    username: payload.username,
    name: payload.name,
    role: payload.role,
    permissions: getRolePermissions(payload.role),
  }
}

// Build the session payload returned to the frontend.
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
    menus: getAccessibleMenus(),
  }
}

// Validate credentials and issue a fresh session.
export async function authenticateUser(payload: LoginRequestBody): Promise<AuthSession> {
  const username = payload.username.trim()
  const password = payload.password.trim()

  if (!username || !password) {
    throw new AppError('Please enter username and password.', 400)
  }

  const account = await findUserByUsername(normalizeUsername(username))

  if (!account) {
    throw new AppError('Invalid username or password.', 401)
  }

  const passwordMatched = await verifyPassword(password, account.password)

  if (!passwordMatched) {
    throw new AppError('Invalid username or password.', 401)
  }

  if (account.status !== 'active') {
    throw new AppError('This account is disabled.', 403)
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

// Validate the access token and refresh user state from PostgreSQL.
export async function verifyAccessToken(token: string) {
  const payload = verifyJwt(token, env.authJwtSecret)

  if (!payload) {
    throw new AppError('Your session is invalid. Please sign in again.', 401)
  }

  const dbUser = await findUserById(payload.sub)

  if (!dbUser) {
    throw new AppError('The current user no longer exists.', 401)
  }

  if (dbUser.status !== 'active') {
    throw new AppError('This account is disabled.', 403)
  }

  return buildAuthenticatedUser({
    ...payload,
    username: payload.username,
    name: dbUser.name,
    role: dbUser.role,
  })
}

// Rebuild the current session for refresh-time login restoration.
export async function getCurrentAuthSession(token: string): Promise<AuthSession> {
  const authUser = await verifyAccessToken(token)

  return buildAuthSession({
    id: authUser.id,
    username: authUser.username,
    name: authUser.name,
    role: authUser.role,
  })
}
