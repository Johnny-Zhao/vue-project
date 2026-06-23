export type UserRole = 'admin' | 'viewer'

export type AppPermission =
  | 'task:create'
  | 'task:edit'
  | 'task:delete'
  | 'task:status:update'
  | 'truck:view'
  | 'truck:batch'
  | 'user:manage'

export interface AuthUser {
  id: number
  name: string
  role: UserRole
}

export interface AuthenticatedUser extends AuthUser {
  username: string
  permissions: AppPermission[]
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: AuthUser
  menus: string[]
}

export interface LoginRequestBody {
  username: string
  password: string
}

export interface JwtPayload {
  sub: number
  username: string
  name: string
  role: UserRole
  iat: number
  exp: number
}
