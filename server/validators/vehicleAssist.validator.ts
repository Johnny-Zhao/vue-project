import type { VehicleAiAssistRequestDto } from '../types/ai.ts'
import type { MessageValidationResult } from '../types/http.ts'

// 校验车辆 AI 分析请求体是否完整。
export function validateVehicleAssistDto(
  dto: unknown,
): MessageValidationResult<VehicleAiAssistRequestDto> {
  if (!dto || typeof dto !== 'object') {
    return {
      valid: false,
      message: '请求体不能为空。',
    }
  }

  const source = dto as Record<string, unknown>
  const vehicle =
    source.vehicle && typeof source.vehicle === 'object'
      ? (source.vehicle as Record<string, unknown>)
      : null

  if (!vehicle) {
    return {
      valid: false,
      message: '车辆 AI 分析请求缺少 vehicle 字段。',
    }
  }

  if (typeof vehicle.id !== 'number' || typeof vehicle.plateNumber !== 'string') {
    return {
      valid: false,
      message: '车辆 AI 分析 DTO 缺少必要字段 id 或 plateNumber。',
    }
  }

  if (!vehicle.flags || !vehicle.metrics) {
    return {
      valid: false,
      message: '车辆 AI 分析 DTO 缺少 flags 或 metrics 字段。',
    }
  }

  return {
    valid: true,
    data: source as unknown as VehicleAiAssistRequestDto,
  }
}
