import type { AuditAction, AuditModule } from './audit.ts'

export interface AuditLogEntity {
  id: number
  module: AuditModule
  action: AuditAction
  entityId: number
  entityName: string
  beforeData: unknown
  afterData: unknown
  operatorId: number
  operatorName: string
  requestId: string
  createdAt: string
}

export interface AuditLogRow {
  id: number | string
  module: AuditModule
  action: AuditAction
  entityId: number | string
  entityName: string
  beforeData: unknown
  afterData: unknown
  operatorId: number | string
  operatorName: string
  requestId: string
  createdAt: string
}

export interface AuditLogQuery {
  module?: AuditModule
  action?: AuditAction
  operatorName?: string
  entityName?: string
  createdFrom?: string
  createdTo?: string
  page?: number | string
  pageSize?: number | string
}

export interface AuditLogFilters {
  module?: AuditModule
  action?: AuditAction
  operatorName: string
  entityName: string
  createdFrom?: string
  createdTo?: string
  page: number
  pageSize: number
}

export interface AuditLogListQuery {
  whereClause: string
  values: unknown[]
}

export interface AuditLogPageResult {
  list: AuditLogEntity[]
  total: number
  page: number
  pageSize: number
}
