import { getPostgresPool } from '../database/postgres.ts'
import type { AuditLogPayload } from '../../types/audit.ts'

// 写入业务审计日志，记录关键数据变更的前后状态。
export async function createAuditLog(payload: AuditLogPayload) {
  const pool = await getPostgresPool()

  await pool.query(
    `
      INSERT INTO audit_logs (
        module,
        action,
        entity_id,
        entity_name,
        before_data,
        after_data,
        operator_id,
        operator_name,
        request_id,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10);
    `,
    [
      payload.module,
      payload.action,
      payload.entityId,
      payload.entityName,
      payload.beforeData ? JSON.stringify(payload.beforeData) : null,
      payload.afterData ? JSON.stringify(payload.afterData) : null,
      payload.operatorId,
      payload.operatorName,
      payload.requestId,
      new Date().toISOString(),
    ],
  )
}
