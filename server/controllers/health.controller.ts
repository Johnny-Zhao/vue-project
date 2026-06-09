import type { ServerRequestHandler } from '../types/http.ts'
import { getServerHealth } from '../services/demo.service.ts'
import { createSuccessResponse } from '../utils/apiResponse.ts'

export const getHealth: ServerRequestHandler = (_req, res) => {
  res.json(createSuccessResponse(getServerHealth(), '健康检查成功'))
}
