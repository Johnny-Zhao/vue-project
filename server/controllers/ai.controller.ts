import type { TruckAiAssistDto } from '../types/ai.ts'
import type { ServerRequestHandler } from '../types/http.ts'
import { generateTruckAssistResult } from '../services/ai/truckAssist.service.ts'
import { createFailureResponse, createSuccessResponse } from '../utils/apiResponse.ts'
import { validateTruckAssistDto } from '../validators/truckAssist.validator.ts'

export const postTruckAssist: ServerRequestHandler = async (req, res) => {
  const dto = req.body
  const validation = validateTruckAssistDto(dto)

  if (!validation.valid) {
    res.status(400).json(createFailureResponse(validation.message, 400))
    return
  }

  try {
    const result = await generateTruckAssistResult(validation.data as TruckAiAssistDto)
    res.json(createSuccessResponse(result, 'AI 分析成功'))
  } catch (error) {
    console.error('[ai] truck assist failed:', error)
    res.status(500).json(createFailureResponse('AI 服务调用失败。', 500))
  }
}
