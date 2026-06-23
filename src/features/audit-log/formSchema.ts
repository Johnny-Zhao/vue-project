import type { FormFieldSchema } from '@/components/formSchemas'
import { auditActionOptions, auditModuleOptions } from './constants'
import type { AuditLogQueryForm } from './types'

// 构建操作日志筛选表单项。
export function createAuditLogQueryFields(): FormFieldSchema[] {
  return [
    {
      key: 'module',
      label: '业务模块',
      type: 'select',
      defaultValue: '',
      options: [{ label: '全部模块', value: '' }, ...auditModuleOptions],
    },
    {
      key: 'action',
      label: '操作类型',
      type: 'select',
      defaultValue: '',
      options: [{ label: '全部类型', value: '' }, ...auditActionOptions],
    },
    {
      key: 'operatorName',
      label: '操作人',
      type: 'input',
      defaultValue: '',
      componentProps: {
        maxlength: 30,
      },
    },
    {
      key: 'entityName',
      label: '业务对象',
      type: 'input',
      defaultValue: '',
      componentProps: {
        maxlength: 120,
      },
    },
    {
      key: 'createdAtRange',
      label: '操作时间',
      type: 'daterange',
      defaultValue: [],
      componentProps: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DDTHH:mm:ss.sssZ',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
      },
    },
  ]
}

// 创建默认筛选表单模型。
export function createAuditLogQueryInitialValue(): AuditLogQueryForm {
  return {
    module: '',
    action: '',
    operatorName: '',
    entityName: '',
    createdAtRange: [],
  }
}
