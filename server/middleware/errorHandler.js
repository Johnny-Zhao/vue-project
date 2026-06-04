import { createFailureResponse } from '../utils/apiResponse.js'

export function errorHandler(error, _req, res, _next) {
  const invalidJson =
    error instanceof SyntaxError &&
    typeof error.message === 'string' &&
    error.message.includes('JSON')

  const statusCode = invalidJson
    ? 400
    : typeof error?.statusCode === 'number'
      ? error.statusCode
      : 500

  const message = invalidJson
    ? '请求体不是合法的 JSON。'
    : error instanceof Error
      ? error.message
      : '服务端处理失败，请稍后重试。'

  console.error('[server] unexpected error:', error)
  res.status(statusCode).json(createFailureResponse(message, statusCode))
}
