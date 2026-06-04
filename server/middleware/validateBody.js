export function validateBody(validator) {
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
