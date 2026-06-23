import type { RequestHandler } from 'express'
import type { AppPermission, UserRole } from '../types/auth.ts'
import { getRolePermissions, verifyAccessToken } from '../modules/auth/auth.service.ts'
import { AppError } from '../utils/appError.ts'

function getAuthorizationHeader(headers: Record<string, string | string[] | undefined>) {
  const value = headers.authorization

  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const authorization = getAuthorizationHeader(req.headers)

  if (!authorization.startsWith('Bearer ')) {
    next(new AppError('未登录或登录已过期。', 401))
    return
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token) {
    next(new AppError('未登录或登录已过期。', 401))
    return
  }

  Promise.resolve(verifyAccessToken(token))
    .then((authUser) => {
      req.authUser = authUser
      next()
    })
    .catch(next)
}

export function authorize(
  options: {
    roles?: UserRole[]
    permissions?: AppPermission[]
  } = {},
): RequestHandler {
  return (req, _res, next) => {
    const authUser = req.authUser

    if (!authUser) {
      next(new AppError('未登录或登录已过期。', 401))
      return
    }

    if (options.roles && options.roles.length > 0 && !options.roles.includes(authUser.role)) {
      next(new AppError('当前账号没有访问权限。', 403))
      return
    }

    if (options.permissions && options.permissions.length > 0) {
      const currentPermissions = getRolePermissions(authUser.role)
      const matched = options.permissions.every((permission) =>
        currentPermissions.includes(permission),
      )

      if (!matched) {
        next(new AppError('当前账号没有访问权限。', 403))
        return
      }
    }

    next()
  }
}
