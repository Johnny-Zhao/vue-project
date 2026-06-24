import type { VehicleAiAssistRequestDto } from '../../types/ai.ts'
import type { ServerRequestHandler } from '../../types/http.ts'
import { getVehicleAssistResult } from './vehicleAssist.service.ts'
import { createFailureResponse, createSuccessResponse } from '../../utils/apiResponse.ts'
import { AppError } from '../../utils/appError.ts'
import { validateVehicleAssistDto } from './vehicleAssist.validator.ts'

// 读取请求上下文中的操作人信息，供 AI 分析落库与审计日志复用。
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

// 处理车辆档案 AI 摘要与异常识别请求。
export const postVehicleAssist: ServerRequestHandler = async (req, res) => {
  const dto = req.body
  const validation = validateVehicleAssistDto(dto)

  if (!validation.valid) {
    res.status(400).json(createFailureResponse(validation.message, 400))
    return
  }

  try {
    const result = await getVehicleAssistResult(
      validation.data as VehicleAiAssistRequestDto,
      getOperatorContext(req),
    )

    res.json(createSuccessResponse(result, '车辆 AI 分析成功'))
  } catch (error) {
    console.error('[ai] vehicle assist failed:', error)

    if (error instanceof AppError) {
      res.status(error.statusCode).json(createFailureResponse(error.message, error.statusCode))
      return
    }

    res.status(500).json(createFailureResponse('AI 服务调用失败。', 500))
  }
}
