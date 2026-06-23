import type { FormFieldOption } from '@/components/formSchemas'
import type { AuditAction, AuditModule } from './types'

export const auditModuleOptions: FormFieldOption[] = [
  { label: '车辆模块', value: 'vehicle' },
  { label: '车辆 AI 模块', value: 'vehicleAi' },
]

export const auditActionOptions: FormFieldOption[] = [
  { label: '新增', value: 'create' },
  { label: '编辑', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '分析', value: 'analyze' },
]

const auditModuleLabelMap: Record<AuditModule, string> = {
  vehicle: '车辆模块',
  vehicleAi: '车辆 AI 模块',
}

const auditActionLabelMap: Record<AuditAction, string> = {
  create: '新增',
  update: '编辑',
  delete: '删除',
  analyze: '分析',
}

// 格式化日志模块显示文本。
export function formatAuditModule(value: AuditModule) {
  return auditModuleLabelMap[value]
}

// 格式化日志动作显示文本。
export function formatAuditAction(value: AuditAction) {
  return auditActionLabelMap[value]
}
