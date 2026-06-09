import type { ServerRequestHandler } from '../types/http.ts'
import { createFailureResponse } from '../utils/apiResponse.ts'

export const notFoundHandler: ServerRequestHandler = (req, res) => {
  res.status(404).json(createFailureResponse(`未找到接口：${req.method} ${req.originalUrl}`, 404))
}
