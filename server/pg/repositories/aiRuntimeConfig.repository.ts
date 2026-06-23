import { getPostgresPool } from '../database/postgres.ts'
import type { AiRuntimeConfigEntity, AiRuntimeConfigRow } from '../../types/aiConfig.ts'

// 将数据库中的 AI 运行配置记录映射为服务层结构。
function mapAiRuntimeConfigRow(row?: AiRuntimeConfigRow | null): AiRuntimeConfigEntity | null {
  if (!row) {
    return null
  }

  return {
    id: Number(row.id),
    model: row.model,
    requestTimeoutMs: Number(row.requestTimeoutMs),
    enableCache: Boolean(row.enableCache),
    allowManualRefresh: Boolean(row.allowManualRefresh),
    suggestRefreshOnSourceChange: Boolean(row.suggestRefreshOnSourceChange),
    openaiStore: Boolean(row.openaiStore),
    updatedAt: row.updatedAt,
    updatedById: Number(row.updatedById),
    updatedByName: row.updatedByName,
  }
}

// 读取当前唯一一份 AI 运行配置。
export async function findAiRuntimeConfig() {
  const pool = await getPostgresPool()
  const result = await pool.query<AiRuntimeConfigRow>(
    `
      SELECT
        id,
        model,
        request_timeout_ms AS "requestTimeoutMs",
        enable_cache AS "enableCache",
        allow_manual_refresh AS "allowManualRefresh",
        suggest_refresh_on_source_change AS "suggestRefreshOnSourceChange",
        openai_store AS "openaiStore",
        updated_at AS "updatedAt",
        updated_by AS "updatedById",
        updated_by_name AS "updatedByName"
      FROM ai_runtime_config
      WHERE id = 1
      LIMIT 1;
    `,
  )

  return mapAiRuntimeConfigRow(result.rows[0] ?? null)
}

// 更新当前唯一一份 AI 运行配置，并返回最新结果。
export async function updateAiRuntimeConfig(payload: {
  model: string
  requestTimeoutMs: number
  enableCache: boolean
  allowManualRefresh: boolean
  suggestRefreshOnSourceChange: boolean
  openaiStore: boolean
  updatedById: number
  updatedByName: string
}) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()

  await pool.query(
    `
      UPDATE ai_runtime_config
      SET
        model = $1,
        request_timeout_ms = $2,
        enable_cache = $3,
        allow_manual_refresh = $4,
        suggest_refresh_on_source_change = $5,
        openai_store = $6,
        updated_at = $7,
        updated_by = $8,
        updated_by_name = $9
      WHERE id = 1;
    `,
    [
      payload.model,
      payload.requestTimeoutMs,
      payload.enableCache,
      payload.allowManualRefresh,
      payload.suggestRefreshOnSourceChange,
      payload.openaiStore,
      now,
      payload.updatedById,
      payload.updatedByName,
    ],
  )

  return findAiRuntimeConfig()
}
