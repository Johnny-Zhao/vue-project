import type { UpdateAiRuntimeConfigPayload } from '../../types/aiConfig.ts'
import type { ServerRequestHandler } from '../../types/http.ts'
import { getAiRuntimeConfigDetail, updateAiRuntimeConfig } from './aiConfig.service.ts'
import { createSuccessResponse } from '../../utils/apiResponse.ts'
import { AppError } from '../../utils/appError.ts'

// 从请求上下文中提取操作人信息，供审计日志复用。
function getOperatorContext(req: Parameters<ServerRequestHandler>[0]) {
  if (!req.authUser || !req.requestId) {
    throw new AppError('当前请求缺少操作人上下文。', 500)
  }

  return {
    operatorId: req.authUser.id,
    operatorName: req.authUser.name,
    requestId: req.requestId,
  }
}

// 返回当前 AI 运行配置详情。
export const getAiRuntimeConfig: ServerRequestHandler = async (_req, res) => {
  const data = await getAiRuntimeConfigDetail()
  res.json(createSuccessResponse(data, '已返回 AI 运行配置'))
}

// 更新当前 AI 运行配置。
export const putAiRuntimeConfig: ServerRequestHandler = async (req, res) => {
  const data = await updateAiRuntimeConfig(
    req.validatedBody as UpdateAiRuntimeConfigPayload,
    getOperatorContext(req),
  )
  res.json(createSuccessResponse(data, 'AI 运行配置更新成功'))
}
