import type { BodyValidationResult, ServerRequestHandler } from '../types/http.ts'

export function validateBody<TValidatedBody>(
  validator: (body: unknown) => BodyValidationResult<TValidatedBody>,
): ServerRequestHandler {
  return function validateRequestBody(req, _res, next) {
    const result = validator(req.body)

    if (!result.valid) {
      next(result.error)
      return
    }

    req.validatedBody = result.data
    next()
  }
}
