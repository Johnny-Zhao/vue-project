import type { FormFieldSchema } from '@/components/formSchemas'
import { taskCategoryOptions, taskPriorityOptions, taskStatusOptions } from './constants'
import type { CreateTaskForm } from './types'
import { createDefaultTaskFormData, taskFormRules } from './composables/useTaskForm'

function normalizeRules(rules: (typeof taskFormRules)[keyof typeof taskFormRules]) {
  if (!rules) {
    return undefined
  }

  return Array.isArray(rules) ? rules : [rules]
}

export function createTaskFormFields(): FormFieldSchema[] {
  const defaults = createDefaultTaskFormData()

  return [
    {
      key: 'title',
      label: 'Task Title',
      type: 'input',
      placeholder: 'For example: finish TypeScript union types and generics',
      required: true,
      defaultValue: defaults.title,
      rules: normalizeRules(taskFormRules.title),
      span: 2,
    },
    {
      key: 'summary',
      label: 'Task Summary',
      type: 'textarea',
      placeholder: 'Write why this task matters so the next review is easier.',
      required: true,
      defaultValue: defaults.summary,
      rules: normalizeRules(taskFormRules.summary),
      componentProps: {
        rows: 4,
        maxlength: 120,
        showWordLimit: true,
      },
      span: 2,
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      placeholder: 'Select a category',
      required: true,
      defaultValue: defaults.category,
      rules: normalizeRules(taskFormRules.category),
      options: taskCategoryOptions,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'Select a status',
      required: true,
      defaultValue: defaults.status,
      rules: normalizeRules(taskFormRules.status),
      options: taskStatusOptions,
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      placeholder: 'Select a priority',
      required: true,
      defaultValue: defaults.priority,
      rules: normalizeRules(taskFormRules.priority),
      options: taskPriorityOptions,
    },
    {
      key: 'estimateHours',
      label: 'Estimate Hours',
      type: 'number',
      required: true,
      defaultValue: defaults.estimateHours,
      rules: normalizeRules(taskFormRules.estimateHours),
      componentProps: {
        min: 1,
        max: 100,
      },
    },
  ]
}

export function createTaskFormInitialValue(source?: Partial<CreateTaskForm>) {
  return {
    ...createDefaultTaskFormData(),
    ...source,
  }
}
