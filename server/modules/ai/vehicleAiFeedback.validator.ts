import type { VehicleAiFeedbackPayload } from '../../types/ai.ts'
import type { MessageValidationResult } from '../../types/http.ts'

// 校验车辆 AI 反馈请求体是否完整。
export function validateVehicleAiFeedbackPayload(
  dto: unknown,
): MessageValidationResult<VehicleAiFeedbackPayload> {
  if (!dto || typeof dto !== 'object') {
    return {
      valid: false,
      message: '请求体不能为空。',
    }
  }

  const source = dto as Record<string, unknown>

  if (typeof source.vehicleId !== 'number' || typeof source.feedbackType !== 'string') {
    return {
      valid: false,
      message: '车辆 AI 反馈缺少必要字段 vehicleId 或 feedbackType。',
    }
  }

  return {
    valid: true,
    data: {
      vehicleId: source.vehicleId,
      feedbackType: source.feedbackType as VehicleAiFeedbackPayload['feedbackType'],
      comment: typeof source.comment === 'string' ? source.comment : undefined,
    },
  }
}
