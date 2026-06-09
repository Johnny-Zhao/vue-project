import type { ServerRequestHandler } from '../types/http.ts'

export function asyncHandler(handler: ServerRequestHandler): ServerRequestHandler {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
