export type AuditModule = 'vehicle' | 'vehicleAi'
export type AuditAction = 'create' | 'update' | 'delete' | 'analyze'

export interface AuditLogItem {
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

export interface AuditLogListQuery {
  module?: AuditModule
  action?: AuditAction
  operatorName?: string
  entityName?: string
  createdFrom?: string
  createdTo?: string
  page?: number
  pageSize?: number
}

export interface AuditLogPageResult {
  list: AuditLogItem[]
  total: number
  page: number
  pageSize: number
}

export interface AuditLogQueryForm {
  module: '' | AuditModule
  action: '' | AuditAction
  operatorName: string
  entityName: string
  createdAtRange: string[]
}
