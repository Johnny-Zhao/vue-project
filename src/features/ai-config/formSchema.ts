import type { FormFieldSchema, FormModel } from '@/components/formSchemas'
import type { AiRuntimeConfigItem, UpdateAiRuntimeConfigPayload } from './types'

// 构建 AI 配置表单项。
export function createAiRuntimeConfigFields(): FormFieldSchema[] {
  return [
    {
      key: 'model',
      label: '模型名称',
      type: 'input',
      required: true,
      defaultValue: '',
      componentProps: {
        maxlength: 60,
      },
    },
    {
      key: 'requestTimeoutMs',
      label: '请求超时（毫秒）',
      type: 'number',
      required: true,
      defaultValue: 30000,
      componentProps: {
        min: 1000,
        max: 120000,
        precision: 0,
      },
    },
    {
      key: 'enableCache',
      label: '启用分析缓存',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'allowManualRefresh',
      label: '允许重新分析',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'suggestRefreshOnSourceChange',
      label: '档案变更时提示重算',
      type: 'switch',
      defaultValue: true,
    },
    {
      key: 'openaiStore',
      label: '启用 OpenAI Store',
      type: 'switch',
      defaultValue: false,
    },
  ]
}

// 创建 AI 配置表单初始值。
export function createAiRuntimeConfigInitialValue(
  source?: Partial<AiRuntimeConfigItem | UpdateAiRuntimeConfigPayload>,
): FormModel {
  return {
    model: source?.model ?? '',
    requestTimeoutMs: source?.requestTimeoutMs ?? 30000,
    enableCache: source?.enableCache ?? true,
    allowManualRefresh: source?.allowManualRefresh ?? true,
    suggestRefreshOnSourceChange: source?.suggestRefreshOnSourceChange ?? true,
    openaiStore: source?.openaiStore ?? false,
  }
}
