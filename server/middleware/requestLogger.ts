import type { ServerRequestHandler } from '../types/http.ts'

export const requestLogger: ServerRequestHandler = (req, res, next) => {
  const startedAt = Date.now()

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt
    const operatorLabel = req.authUser ? `${req.authUser.id}:${req.authUser.username}` : 'anonymous'
    console.log(
      `[server] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms) [${req.requestId}] [user:${operatorLabel}]`,
    )
  })

  next()
}
