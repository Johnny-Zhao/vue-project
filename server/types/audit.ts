export type AuditModule = 'vehicle' | 'vehicleAi' | 'aiConfig'
export type AuditAction = 'create' | 'update' | 'delete' | 'analyze'

export interface AuditLogPayload {
  module: AuditModule
  action: AuditAction
  entityId: number
  entityName: string
  beforeData?: unknown
  afterData?: unknown
  operatorId: number
  operatorName: string
  requestId: string
}
