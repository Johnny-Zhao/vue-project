import { randomUUID } from 'node:crypto'
import type { ServerRequestHandler } from '../types/http.ts'

export const requestContext: ServerRequestHandler = (req, res, next) => {
  req.requestId = randomUUID()
  req.requestStartedAt = Date.now()

  res.setHeader('X-Request-Id', req.requestId)
  next()
}
