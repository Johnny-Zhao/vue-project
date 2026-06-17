import type { LoginRequestBody } from '../types/auth.ts'
import type { ServerRequestHandler } from '../types/http.ts'
import { authenticateUser, getCurrentAuthSession } from '../services/auth.service.ts'
import { createSuccessResponse } from '../utils/apiResponse.ts'

function getBearerToken(authorizationHeader?: string | string[]) {
  const value = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader

  if (!value?.startsWith('Bearer ')) {
    return ''
  }

  return value.slice('Bearer '.length).trim()
}

export const postLogin: ServerRequestHandler = async (req, res) => {
  const session = await authenticateUser(req.body as LoginRequestBody)
  res.json(createSuccessResponse(session, '登录成功'))
}

export const getCurrentUser: ServerRequestHandler = async (req, res) => {
  const session = await getCurrentAuthSession(getBearerToken(req.headers.authorization))

  res.json(createSuccessResponse(session, '已返回当前登录用户信息'))
}
