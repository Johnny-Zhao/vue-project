import type { AuditAction, AuditModule } from '../../types/audit.ts'
import type { AuditLogPageResult, AuditLogQuery } from '../../types/auditLog.ts'
import { listAuditLogs as listAuditLogRecords } from './auditLogQuery.repository.ts'

const allowedModules: AuditModule[] = ['vehicle', 'vehicleAi', 'aiConfig']
const allowedActions: AuditAction[] = ['create', 'update', 'delete', 'analyze']

// 规范化文本查询条件。
function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

// 解析正整数分页参数。
function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

// 解析枚举筛选条件。
function parseEnum<T extends string>(value: unknown, allowedValues: T[]) {
  if (typeof value !== 'string') {
    return undefined
  }

  return allowedValues.includes(value as T) ? (value as T) : undefined
}

// 解析时间范围筛选条件。
function parseDateTime(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

// 获取分页审计日志列表。
export async function getAuditLogPageResult(
  query: AuditLogQuery = {},
): Promise<AuditLogPageResult> {
  const module = parseEnum(query.module, allowedModules)
  const action = parseEnum(query.action, allowedActions)
  const operatorName = normalizeText(query.operatorName, 30)
  const entityName = normalizeText(query.entityName, 120)
  const createdFrom = parseDateTime(query.createdFrom)
  const createdTo = parseDateTime(query.createdTo)
  const page = parsePositiveInt(query.page, 1)
  const pageSize = Math.min(parsePositiveInt(query.pageSize, 10), 50)

  const result = await listAuditLogRecords({
    module,
    action,
    operatorName,
    entityName,
    createdFrom,
    createdTo,
    page,
    pageSize,
  })

  return {
    list: result.list,
    total: result.total,
    page,
    pageSize,
  }
}
