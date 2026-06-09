import type { ServerErrorHandler } from '../types/http.ts'
import { createFailureResponse } from '../utils/apiResponse.ts'

export const errorHandler: ServerErrorHandler = (error, _req, res, _next) => {
  const invalidJson =
    error instanceof SyntaxError &&
    typeof error.message === 'string' &&
    error.message.includes('JSON')

  const statusCode = invalidJson
    ? 400
    : typeof (error as { statusCode?: unknown })?.statusCode === 'number'
      ? ((error as { statusCode: number }).statusCode ?? 500)
      : 500

  const message = invalidJson
    ? 'Request body is not valid JSON.'
    : error instanceof Error
      ? error.message
      : 'Server request handling failed.'

  console.error('[server] unexpected error:', error)
  res.status(statusCode).json(createFailureResponse(message, statusCode))
}
