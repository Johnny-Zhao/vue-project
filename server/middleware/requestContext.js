import { randomUUID } from 'node:crypto'

/**
 * 请求上下文中间件：为每个 HTTP 请求生成唯一标识并记录开始时间。
 *
 * 在 app.js 里应尽早挂载（位于 requestLogger 之前），
 * 这样后续日志、错误处理都能通过 req.requestId 关联同一次请求。
 *
 * 响应头 X-Request-Id 便于前端或网关排查问题时回传该 ID。
 */
export function requestContext(req, res, next) {
  // 本次请求的唯一 ID，用于日志串联（见 requestLogger.js）
  req.requestId = randomUUID()
  // 请求进入中间件链的时刻（毫秒时间戳），可供业务统计耗时等扩展使用
  req.requestStartedAt = Date.now()

  // 把 requestId 写回响应，客户端可在 Network 面板看到并用于反馈/排错
  res.setHeader('X-Request-Id', req.requestId)
  next()
}
