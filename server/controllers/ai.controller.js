import { generateTruckAssistResult } from '../services/ai/truckAssist.service.js'
import { createFailureResponse, createSuccessResponse } from '../utils/apiResponse.js'
import { validateTruckAssistDto } from '../validators/truckAssist.validator.js'

export async function postTruckAssist(req, res) {
  const dto = req.body
  const validation = validateTruckAssistDto(dto)

  if (!validation.valid) {
    res.status(400).json(createFailureResponse(validation.message, 400))
    return
  }

  try {
    const result = await generateTruckAssistResult(dto)
    res.json(createSuccessResponse(result, 'AI 分析成功'))
  } catch (error) {
    console.error('[ai] truck assist failed:', error)
    res.status(500).json(createFailureResponse('AI 服务调用失败。', 500))
  }
}
