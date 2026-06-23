import { env } from '../config/env.ts'
import { createAuditLog } from '../pg/repositories/auditLog.repository.ts'
import {
  findAiRuntimeConfig,
  updateAiRuntimeConfig as updateAiRuntimeConfigRecord,
} from '../pg/repositories/aiRuntimeConfig.repository.ts'
import type {
  AiRuntimeConfigEntity,
  AiRuntimeConfigView,
  UpdateAiRuntimeConfigPayload,
} from '../types/aiConfig.ts'
import { AppError } from '../utils/appError.ts'

interface OperationContext {
  operatorId: number
  operatorName: string
  requestId: string
}

// 返回当前 AI 运行配置，并补充敏感配置的只读状态。
export async function getAiRuntimeConfigDetail(): Promise<AiRuntimeConfigView> {
  const config = await findAiRuntimeConfig()

  if (!config) {
    throw new AppError('未找到 AI 运行配置。', 500)
  }

  return buildAiRuntimeConfigView(config)
}

// 提供给 AI 运行时使用的当前配置快照。
export async function getAiRuntimeConfigSnapshot(): Promise<AiRuntimeConfigView> {
  return getAiRuntimeConfigDetail()
}

// 更新当前 AI 运行配置，并写入审计日志。
export async function updateAiRuntimeConfig(
  payload: UpdateAiRuntimeConfigPayload,
  context: OperationContext,
): Promise<AiRuntimeConfigView> {
  const currentConfig = await findAiRuntimeConfig()

  if (!currentConfig) {
    throw new AppError('未找到 AI 运行配置。', 500)
  }

  const updatedConfig = await updateAiRuntimeConfigRecord({
    ...payload,
    updatedById: context.operatorId,
    updatedByName: context.operatorName,
  })

  if (!updatedConfig) {
    throw new AppError('更新 AI 运行配置失败。', 500)
  }

  await createAuditLog({
    module: 'aiConfig',
    action: 'update',
    entityId: updatedConfig.id,
    entityName: 'AI 运行配置',
    beforeData: buildAiRuntimeConfigView(currentConfig),
    afterData: buildAiRuntimeConfigView(updatedConfig),
    operatorId: context.operatorId,
    operatorName: context.operatorName,
    requestId: context.requestId,
  })

  return buildAiRuntimeConfigView(updatedConfig)
}

// 将数据库配置补充为前端可直接展示的视图结构。
function buildAiRuntimeConfigView(config: AiRuntimeConfigEntity): AiRuntimeConfigView {
  return {
    ...config,
    apiKeyConfigured: Boolean(env.openaiApiKey),
    endpointLabel: env.openaiBaseUrl || '官方默认地址',
  }
}
