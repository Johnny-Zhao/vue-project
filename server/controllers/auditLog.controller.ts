import type { ServerRequestHandler } from '../types/http.ts'
import { getAuditLogPageResult } from '../services/auditLog.service.ts'
import { createSuccessResponse } from '../utils/apiResponse.ts'

// 返回审计日志分页列表。
export const getAuditLogs: ServerRequestHandler = async (req, res) => {
  const data = await getAuditLogPageResult(req.query)
  res.json(createSuccessResponse(data, '操作日志加载成功'))
}
