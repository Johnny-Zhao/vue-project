import { AppError } from '../utils/appError.js'

export function requireJsonContent(req, _res, next) {
  if (req.method === 'GET' || req.method === 'DELETE') {
    next()
    return
  }

  if (!req.is('application/json')) {
    next(new AppError('当前接口只接受 application/json 请求体。', 415))
    return
  }

  next()
}
