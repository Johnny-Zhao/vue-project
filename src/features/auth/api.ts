import {
  createApiFailureResponse,
  createApiSuccessResponse,
  mockApiRequest,
} from '@/api/request'
import type { LoginPayload, AuthSession, AuthUser } from './types'

const SESSION_DURATION_MS = 30 * 60 * 1000

function createUser(username: string): AuthUser {
  const normalizedUsername = username.trim().toLowerCase()

  if (normalizedUsername === 'viewer') {
    return {
      id: 2,
      name: 'Viewer User',
      role: 'viewer',
    }
  }

  return {
    id: 1,
    name: normalizedUsername === 'admin' ? 'Admin User' : username.trim(),
    role: 'admin',
  }
}

function createSession(username: string): AuthSession {
  const tokenSeed = `${username}-${Date.now()}`

  return {
    accessToken: `access-${tokenSeed}`,
    refreshToken: `refresh-${tokenSeed}`,
    expiresAt: Date.now() + SESSION_DURATION_MS,
    user: createUser(username),
  }
}

export async function loginApi(payload: LoginPayload) {
  return mockApiRequest(
    () => {
      const username = payload.username.trim()
      const password = payload.password.trim()

      if (!username || !password) {
        return createApiFailureResponse(400, '请输入用户名和密码')
      }

      if (username.toLowerCase() === 'forbidden') {
        return createApiFailureResponse(403, '当前账号没有后台访问权限')
      }

      return createApiSuccessResponse(createSession(username), '登录成功')
    },
    {
      auth: false,
      delay: 450,
    },
  )
}
