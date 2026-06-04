import { createFailureResponse } from '../utils/apiResponse.js'

export function notFoundHandler(req, res) {
  res.status(404).json(createFailureResponse(`未找到接口：${req.method} ${req.originalUrl}`, 404))
}
