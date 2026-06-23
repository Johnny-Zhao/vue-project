import { getPostgresPool } from '../../pg/database/postgres.ts'
import type {
  AuditLogEntity,
  AuditLogFilters,
  AuditLogListQuery,
  AuditLogRow,
} from '../../types/auditLog.ts'

interface CountRow {
  count?: string
}

// 将数据库日志行映射为前后端共享的日志实体。
function mapAuditLogRow(row?: AuditLogRow | null): AuditLogEntity | null {
  if (!row) {
    return null
  }

  return {
    id: Number(row.id),
    module: row.module,
    action: row.action,
    entityId: Number(row.entityId),
    entityName: row.entityName,
    beforeData: row.beforeData ?? null,
    afterData: row.afterData ?? null,
    operatorId: Number(row.operatorId),
    operatorName: row.operatorName,
    requestId: row.requestId,
    createdAt: row.createdAt,
  }
}

// 根据筛选条件构建日志列表查询。
function buildAuditLogListQuery(filters: AuditLogFilters): AuditLogListQuery {
  const conditions: string[] = []
  const values: unknown[] = []

  if (filters.module) {
    values.push(filters.module)
    conditions.push(`module = $${values.length}`)
  }

  if (filters.action) {
    values.push(filters.action)
    conditions.push(`action = $${values.length}`)
  }

  if (filters.operatorName) {
    values.push(`%${filters.operatorName}%`)
    conditions.push(`operator_name ILIKE $${values.length}`)
  }

  if (filters.entityName) {
    values.push(`%${filters.entityName}%`)
    conditions.push(`entity_name ILIKE $${values.length}`)
  }

  if (filters.createdFrom) {
    values.push(filters.createdFrom)
    conditions.push(`created_at >= $${values.length}`)
  }

  if (filters.createdTo) {
    values.push(filters.createdTo)
    conditions.push(`created_at <= $${values.length}`)
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  }
}

// 查询审计日志列表并返回分页结果。
export async function listAuditLogs(filters: AuditLogFilters) {
  const pool = await getPostgresPool()
  const { whereClause, values } = buildAuditLogListQuery(filters)
  const offset = (filters.page - 1) * filters.pageSize
  const pagingValues = [...values, filters.pageSize, offset]
  const limitIndex = pagingValues.length - 1
  const offsetIndex = pagingValues.length

  const rowsResult = await pool.query<AuditLogRow>(
    `
      SELECT
        id,
        module,
        action,
        entity_id AS "entityId",
        entity_name AS "entityName",
        before_data AS "beforeData",
        after_data AS "afterData",
        operator_id AS "operatorId",
        operator_name AS "operatorName",
        request_id AS "requestId",
        created_at AS "createdAt"
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex};
    `,
    pagingValues,
  )

  const countResult = await pool.query<CountRow>(
    `
      SELECT COUNT(*)::text AS count
      FROM audit_logs
      ${whereClause};
    `,
    values,
  )

  return {
    list: rowsResult.rows
      .map((row) => mapAuditLogRow(row))
      .filter((item): item is AuditLogEntity => item !== null),
    total: Number(countResult.rows[0]?.count || 0),
  }
}
