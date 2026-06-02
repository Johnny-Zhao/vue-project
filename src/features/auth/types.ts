export type UserRole = 'admin' | 'viewer'

export type AppPermission =
  | 'task:create'
  | 'task:edit'
  | 'task:delete'
  | 'task:status:update'
  | 'truck:view'
  | 'truck:batch'

export interface AuthUser {
  id: number
  name: string
  role: UserRole
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: AuthUser
}

export interface LoginPayload {
  username: string
  password: string
  remember: boolean
}
