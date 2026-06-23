import type { MessageValidationResult } from '../../types/http.ts'
import type { TruckAiAssistDto } from '../../types/ai.ts'

export function validateTruckAssistDto(dto: unknown): MessageValidationResult<TruckAiAssistDto> {
  if (!dto || typeof dto !== 'object') {
    return {
      valid: false,
      message: '请求体不能为空。',
    }
  }

  const source = dto as Record<string, unknown>

  if (typeof source.id !== 'number' || typeof source.truckType !== 'string') {
    return {
      valid: false,
      message: '车辆 AI 分析 DTO 缺少必要字段 id 或 truckType。',
    }
  }

  if (!source.flags || !source.metrics) {
    return {
      valid: false,
      message: '车辆 AI 分析 DTO 缺少 flags 或 metrics 字段。',
    }
  }

  return {
    valid: true,
    data: source as unknown as TruckAiAssistDto,
  }
}
