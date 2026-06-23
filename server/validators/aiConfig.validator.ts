import type { BodyValidationResult } from '../types/http.ts'
import type { UpdateAiRuntimeConfigPayload } from '../types/aiConfig.ts'
import { AppError } from '../utils/appError.ts'

// 规范化字符串输入，避免写入过长或空白值。
function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

// 规范化布尔配置项，缺失时返回 false。
function normalizeBoolean(value: unknown) {
  return value === true
}

// 校验并组装 AI 运行配置更新请求体。
export function validateUpdateAiRuntimeConfigPayload(
  body: unknown,
): BodyValidationResult<UpdateAiRuntimeConfigPayload> {
  const source = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const model = normalizeText(source.model, 60)
  const requestTimeoutMs = Number(source.requestTimeoutMs)

  if (!model) {
    return { valid: false, error: new AppError('模型名称不能为空。', 400) }
  }

  if (!Number.isInteger(requestTimeoutMs) || requestTimeoutMs < 1000 || requestTimeoutMs > 120000) {
    return { valid: false, error: new AppError('超时时间必须是 1000 到 120000 之间的整数。', 400) }
  }

  return {
    valid: true,
    data: {
      model,
      requestTimeoutMs,
      enableCache: normalizeBoolean(source.enableCache),
      allowManualRefresh: normalizeBoolean(source.allowManualRefresh),
      suggestRefreshOnSourceChange: normalizeBoolean(source.suggestRefreshOnSourceChange),
      openaiStore: normalizeBoolean(source.openaiStore),
    },
  }
}
