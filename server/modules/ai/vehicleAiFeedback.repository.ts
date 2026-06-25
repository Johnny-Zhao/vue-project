import { getPostgresPool } from '../../pg/database/postgres.ts'
import type {
  VehicleAiFeedbackEntity,
  VehicleAiFeedbackPayload,
  VehicleAiFeedbackRow,
} from '../../types/ai.ts'

// 将反馈表记录映射为服务层可读结构。
function mapVehicleAiFeedbackRow(
  row?: VehicleAiFeedbackRow | null,
): VehicleAiFeedbackEntity | null {
  if (!row) {
    return null
  }

  return {
    id: Number(row.id),
    vehicleId: Number(row.vehicleId),
    feedbackType: row.feedbackType,
    comment: row.comment ?? '',
    createdAt: row.createdAt,
    createdById: Number(row.createdById),
    createdByName: row.createdByName,
  }
}

// 新增一条 AI 结果反馈记录。
export async function createVehicleAiFeedback(
  payload: VehicleAiFeedbackPayload & {
    createdAt: string
    createdById: number
    createdByName: string
  },
) {
  const pool = await getPostgresPool()
  const result = await pool.query<VehicleAiFeedbackRow>(
    `
      INSERT INTO vehicle_ai_feedback (
        vehicle_id,
        feedback_type,
        comment,
        created_at,
        created_by_id,
        created_by_name
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        vehicle_id AS "vehicleId",
        feedback_type AS "feedbackType",
        comment,
        created_at AS "createdAt",
        created_by_id AS "createdById",
        created_by_name AS "createdByName";
    `,
    [
      payload.vehicleId,
      payload.feedbackType,
      payload.comment,
      payload.createdAt,
      payload.createdById,
      payload.createdByName,
    ],
  )

  return mapVehicleAiFeedbackRow(result.rows[0] ?? null)
}
