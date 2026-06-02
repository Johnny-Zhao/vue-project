import type { FormItemRule } from 'element-plus'

export type FormModel = Record<string, unknown>

export type FieldVisibility = boolean | ((model: FormModel) => boolean)

export interface FormFieldOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export type FormFieldType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'number'
  | 'switch'
  | 'date'
  | 'daterange'
  | 'checkbox'

export interface FormFieldSchema {
  key: string
  label: string
  type: FormFieldType
  placeholder?: string
  required?: boolean
  rules?: FormItemRule[]
  options?: FormFieldOption[]
  defaultValue?: unknown
  span?: number
  visible?: FieldVisibility
  disabled?: FieldVisibility
  componentProps?: Record<string, unknown>
  onChange?: (value: unknown, model: FormModel) => Partial<FormModel> | void
}

export interface TableColumnSchema<T = Record<string, unknown>> {
  key: string
  label: string
  prop?: keyof T | string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean | 'custom'
  fixed?: boolean | 'left' | 'right'
  formatter?: (row: T, index: number) => unknown
}

export interface TablePagination {
  currentPage: number
  pageSize: number
  total: number
  pageSizes?: number[]
}

export interface TableBatchAction<T = Record<string, unknown>> {
  key: string
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  disabled?: (rows: T[]) => boolean
}

export function evaluateFieldVisibility(
  value: FieldVisibility | undefined,
  model: FormModel,
  defaultValue = true,
) {
  if (typeof value === 'function') {
    return value(model)
  }

  if (typeof value === 'boolean') {
    return value
  }

  return defaultValue
}

export function resolveFieldDefault(field: FormFieldSchema) {
  if (field.defaultValue !== undefined) {
    return field.defaultValue
  }

  if (field.type === 'switch' || field.type === 'checkbox') {
    return false
  }

  if (field.type === 'daterange') {
    return []
  }

  return ''
}

export function createModelFromFields(fields: FormFieldSchema[], source: FormModel = {}) {
  const nextModel: FormModel = {}

  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(source, field.key)) {
      nextModel[field.key] = source[field.key]
      continue
    }

    nextModel[field.key] = resolveFieldDefault(field)
  }

  return nextModel
}
