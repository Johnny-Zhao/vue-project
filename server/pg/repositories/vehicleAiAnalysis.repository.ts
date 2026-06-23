import { getPostgresPool } from '../database/postgres.ts'
import type {
  AiAssistResult,
  VehicleAiAnalysisEntity,
  VehicleAiAnalysisRow,
} from '../../types/ai.ts'

interface IdRow {
  vehicleId?: number | string
}

// 将数据库中的车辆 AI 分析记录映射为服务层可读结构。
function mapVehicleAiAnalysisRow(
  row?: VehicleAiAnalysisRow | null,
): VehicleAiAnalysisEntity | null {
  if (!row) {
    return null
  }

  return {
    vehicleId: Number(row.vehicleId),
    summary: Array.isArray(row.summary) ? row.summary.filter(isNonEmptyString) : [],
    risks: Array.isArray(row.risks) ? row.risks.filter(isNonEmptyString) : [],
    nextActions: Array.isArray(row.nextActions) ? row.nextActions.filter(isNonEmptyString) : [],
    confidence: row.confidence,
    source: row.source,
    generatedAt: row.generatedAt,
    notice: row.notice ?? undefined,
    sourceUpdatedAt: row.sourceUpdatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// 按车辆 id 查询最近一次已保存的 AI 分析结果。
export async function findVehicleAiAnalysisByVehicleId(vehicleId: number) {
  const pool = await getPostgresPool()
  const result = await pool.query<VehicleAiAnalysisRow>(
    `
      SELECT
        vehicle_id AS "vehicleId",
        summary_json AS "summary",
        risks_json AS "risks",
        next_actions_json AS "nextActions",
        confidence,
        source,
        generated_at AS "generatedAt",
        notice,
        source_updated_at AS "sourceUpdatedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM vehicle_ai_analysis
      WHERE vehicle_id = $1
      LIMIT 1;
    `,
    [vehicleId],
  )

  return mapVehicleAiAnalysisRow(result.rows[0] ?? null)
}

// 新增或覆盖车辆当前最新的一份 AI 分析结果。
export async function upsertVehicleAiAnalysis(
  vehicleId: number,
  result: AiAssistResult,
  sourceUpdatedAt: string,
) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()
  const upsertResult = await pool.query<IdRow>(
    `
      INSERT INTO vehicle_ai_analysis (
        vehicle_id,
        summary_json,
        risks_json,
        next_actions_json,
        confidence,
        source,
        generated_at,
        notice,
        source_updated_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (vehicle_id)
      DO UPDATE SET
        summary_json = EXCLUDED.summary_json,
        risks_json = EXCLUDED.risks_json,
        next_actions_json = EXCLUDED.next_actions_json,
        confidence = EXCLUDED.confidence,
        source = EXCLUDED.source,
        generated_at = EXCLUDED.generated_at,
        notice = EXCLUDED.notice,
        source_updated_at = EXCLUDED.source_updated_at,
        updated_at = EXCLUDED.updated_at
      RETURNING vehicle_id AS "vehicleId";
    `,
    [
      vehicleId,
      JSON.stringify(result.summary),
      JSON.stringify(result.risks),
      JSON.stringify(result.nextActions),
      result.confidence,
      result.source,
      result.generatedAt,
      result.notice ?? null,
      sourceUpdatedAt,
      now,
      now,
    ],
  )

  return findVehicleAiAnalysisByVehicleId(Number(upsertResult.rows[0]?.vehicleId))
}

// 判断数组项是否为有效非空文本。
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
