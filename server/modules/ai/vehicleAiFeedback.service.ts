import { createAuditLog } from '../auditLog/auditLog.repository.ts'
import { getVehicleDetail } from '../vehicle/vehicle.service.ts'
import { AppError } from '../../utils/appError.ts'
import { createVehicleAiFeedback } from './vehicleAiFeedback.repository.ts'
import type { VehicleAiFeedbackPayload } from '../../types/ai.ts'

interface OperationContext {
  operatorId: number
  operatorName: string
  requestId: string
}

// 校验并保存 AI 结果反馈，同时写入审计日志。
export async function submitVehicleAiFeedback(
  payload: VehicleAiFeedbackPayload,
  context: OperationContext,
) {
  if (!Number.isInteger(payload.vehicleId) || payload.vehicleId <= 0) {
    throw new AppError('车辆 AI 反馈缺少有效的 vehicleId。', 400, 'AI_FEEDBACK_INVALID')
  }

  if (!['helpful', 'inaccurate', 'retry'].includes(payload.feedbackType)) {
    throw new AppError('车辆 AI 反馈类型不合法。', 400, 'AI_FEEDBACK_INVALID')
  }

  const vehicle = await getVehicleDetail(String(payload.vehicleId))

  if (!vehicle) {
    throw new AppError('未找到要反馈的车辆档案。', 404, 'AI_FEEDBACK_VEHICLE_NOT_FOUND')
  }

  const feedback = await createVehicleAiFeedback({
    vehicleId: payload.vehicleId,
    feedbackType: payload.feedbackType,
    comment: String(payload.comment ?? '').trim(),
    createdAt: new Date().toISOString(),
    createdById: context.operatorId,
    createdByName: context.operatorName,
  })

  if (!feedback) {
    throw new AppError('保存 AI 反馈失败。', 500, 'AI_FEEDBACK_SAVE_FAILED')
  }

  await createAuditLog({
    module: 'vehicleAi',
    action: 'feedback',
    entityId: payload.vehicleId,
    entityName: vehicle.plateNumber,
    afterData: feedback,
    operatorId: context.operatorId,
    operatorName: context.operatorName,
    requestId: context.requestId,
  })

  return feedback
}
