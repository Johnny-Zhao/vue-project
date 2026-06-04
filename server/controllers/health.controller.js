import { getServerHealth } from '../services/demo.service.js'
import { createSuccessResponse } from '../utils/apiResponse.js'

export function getHealth(_req, res) {
  res.json(createSuccessResponse(getServerHealth(), '健康检查成功'))
}
