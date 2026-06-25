import OpenAI from 'openai'
import { env } from '../../config/env.ts'
import { createAuditLog } from '../auditLog/auditLog.repository.ts'
import {
  findVehicleAiAnalysisByVehicleId,
  upsertVehicleAiAnalysis,
} from './vehicleAiAnalysis.repository.ts'
import type {
  AiAssistResult,
  AiConfidence,
  AiFailureCode,
  AiRequestMode,
  AiResultStatus,
  AiRuntimeMeta,
  VehicleAiAnalysisEntity,
  VehicleAiAssistDto,
  VehicleAiAssistRequestDto,
} from '../../types/ai.ts'
import type { AiRuntimeConfigView } from '../../types/aiConfig.ts'
import { AppError } from '../../utils/appError.ts'
import { getAiRuntimeConfigSnapshot } from '../ai-config/aiConfig.service.ts'

type OpenAiNormalizedResult = Pick<
  AiAssistResult,
  'summary' | 'risks' | 'nextActions' | 'confidence'
>

interface VehicleAiOperationContext {
  operatorId: number
  operatorName: string
  requestId: string
}

type VehicleAiGenerationAttempt =
  | {
      kind: 'success'
      result: OpenAiNormalizedResult
    }
  | {
      kind: 'failure'
      failureCode: AiFailureCode
      notice: string
    }

// 为当前请求创建 OpenAI 客户端，确保运行时配置改动后立刻生效。
function createOpenAiClient(runtimeConfig: AiRuntimeConfigView) {
  return new OpenAI({
    apiKey: env.openaiApiKey,
    timeout: runtimeConfig.requestTimeoutMs,
    baseURL: env.openaiBaseUrl || undefined,
  })
}

// 读取或生成车辆档案 AI 分析结果，并在需要时落库与写审计日志。
export async function getVehicleAssistResult(
  payload: VehicleAiAssistRequestDto,
  context: VehicleAiOperationContext,
): Promise<AiAssistResult> {
  const { vehicle, forceRefresh = false } = payload
  const runtimeConfig = await getAiRuntimeConfigSnapshot()
  const savedAnalysis = await findVehicleAiAnalysisByVehicleId(vehicle.id)
  const requestMode = resolveRequestMode(forceRefresh)

  if (forceRefresh && !runtimeConfig.allowManualRefresh) {
    throw new AppError(
      '当前 AI 配置已关闭手动重新分析，请前往 AI 配置页开启后再试。',
      400,
      'AI_MANUAL_REFRESH_DISABLED',
    )
  }

  if (runtimeConfig.enableCache && savedAnalysis && !forceRefresh) {
    return buildCachedVehicleAssistResult(savedAnalysis, vehicle, runtimeConfig)
  }

  const generationAttempt = await attemptVehicleAssistGeneration(vehicle, runtimeConfig)

  if (generationAttempt.kind === 'success') {
    return persistVehicleAssistResult(
      vehicle,
      savedAnalysis,
      context,
      buildApiVehicleAssistResult(generationAttempt.result, runtimeConfig, requestMode),
      runtimeConfig,
      requestMode,
      'api-success',
    )
  }

  if (savedAnalysis) {
    const recoveredResult = buildRecoveredVehicleAssistResult(
      savedAnalysis,
      runtimeConfig,
      requestMode,
      generationAttempt.failureCode,
      generationAttempt.notice,
    )

    await createVehicleAiAuditLog({
      context,
      vehicle,
      beforeData: savedAnalysis,
      afterData: recoveredResult,
    })

    return recoveredResult
  }

  return persistVehicleAssistResult(
    vehicle,
    savedAnalysis,
    context,
    buildRuleFallbackVehicleAssistResult(
      vehicle,
      runtimeConfig,
      requestMode,
      generationAttempt.failureCode,
      generationAttempt.notice,
    ),
    runtimeConfig,
    requestMode,
    generationAttempt.failureCode === 'AI_NO_API_KEY' ? 'mock-generated' : 'rule-fallback',
    generationAttempt.failureCode,
  )
}

// 尝试生成真实 AI 结果，并把失败原因转换成统一错误码。
async function attemptVehicleAssistGeneration(
  dto: VehicleAiAssistDto,
  runtimeConfig: AiRuntimeConfigView,
): Promise<VehicleAiGenerationAttempt> {
  if (!runtimeConfig.apiKeyConfigured) {
    return {
      kind: 'failure',
      failureCode: 'AI_NO_API_KEY',
      notice: '当前未配置 OPENAI_API_KEY，系统已切换为规则兜底结果。',
    }
  }

  try {
    const result = await requestOpenAiVehicleAssist(dto, runtimeConfig)

    return {
      kind: 'success',
      result,
    }
  } catch (error) {
    const failureCode = resolveAiFailureCode(error)

    return {
      kind: 'failure',
      failureCode,
      notice: resolveAiFailureNotice(failureCode),
    }
  }
}

// 生成最终 API 成功结果，供落库和前端展示复用。
function buildApiVehicleAssistResult(
  result: OpenAiNormalizedResult,
  runtimeConfig: AiRuntimeConfigView,
  requestMode: AiRequestMode,
): AiAssistResult {
  return sanitizeAiAssistResult(result, 'api', runtimeConfig, {
    requestMode,
    resultStatus: 'api-success',
    degraded: false,
  })
}

// 生成规则兜底结果，并带上降级原因码。
function buildRuleFallbackVehicleAssistResult(
  dto: VehicleAiAssistDto,
  runtimeConfig: AiRuntimeConfigView,
  requestMode: AiRequestMode,
  failureCode: AiFailureCode,
  notice: string,
): AiAssistResult {
  const summary = [
    `车辆 ${dto.plateNumber} 属于${dto.vehicleType}，当前状态为${dto.status}。`,
    `该车辆采用${dto.driveType}驱动，能源类型为${dto.energyType}。`,
    dto.brandModel ? `品牌型号为 ${dto.brandModel}。` : '品牌型号尚未补录完整。',
    dto.metrics.daysSinceUpdate == null
      ? '最近更新时间缺失，暂时无法判断档案是否过旧。'
      : `最近一次更新距今 ${dto.metrics.daysSinceUpdate} 天，更新人是 ${dto.updatedBy}。`,
  ]

  const risks = buildVehicleRisks(dto)
  const nextActions = buildVehicleNextActions(dto, risks.length)
  const source = failureCode === 'AI_NO_API_KEY' ? 'mock' : 'fallback'
  const resultStatus: AiResultStatus =
    failureCode === 'AI_NO_API_KEY' ? 'mock-generated' : 'rule-fallback'

  return {
    summary: summary.slice(0, 5),
    risks: risks.slice(0, 6),
    nextActions: nextActions.slice(0, 5),
    confidence: resolveConfidence(dto, risks.length),
    source,
    cached: false,
    generatedAt: new Date().toISOString(),
    notice,
    runtime: createVehicleAiRuntimeMeta(runtimeConfig, {
      requestMode,
      resultStatus,
      refreshRecommended: shouldRecommendRefresh(failureCode),
      degraded: true,
      failureCode,
    }),
  }
}

// 将数据库中的分析记录转换成接口返回结构。
function buildPersistedVehicleAssistResult(
  entity: VehicleAiAnalysisEntity,
  requestMode: AiRequestMode,
  runtimeConfig: AiRuntimeConfigView,
  options: {
    resultStatus: AiResultStatus
    refreshRecommended: boolean
    degraded: boolean
    failureCode?: AiFailureCode
  },
): AiAssistResult {
  return {
    summary: entity.summary,
    risks: entity.risks,
    nextActions: entity.nextActions,
    confidence: entity.confidence,
    source: entity.source,
    cached: false,
    generatedAt: entity.generatedAt,
    notice: entity.notice,
    runtime: createVehicleAiRuntimeMeta(runtimeConfig, {
      requestMode,
      resultStatus: options.resultStatus,
      refreshRecommended: options.refreshRecommended,
      degraded: options.degraded,
      failureCode: options.failureCode,
    }),
  }
}

// 将数据库缓存结果转换成接口结构，并评估是否建议刷新。
function buildCachedVehicleAssistResult(
  entity: VehicleAiAnalysisEntity,
  dto: VehicleAiAssistDto,
  runtimeConfig: AiRuntimeConfigView,
): AiAssistResult {
  const isOutdated = hasSourceChanged(entity.sourceUpdatedAt, dto.updatedAt)
  const refreshRecommended = runtimeConfig.suggestRefreshOnSourceChange && isOutdated
  const cacheNotice = isOutdated
    ? '当前展示的是已保存的历史分析结果，车辆档案已更新，建议重新分析以刷新结果。'
    : '当前展示的是数据库中最近一次已保存的 AI 分析结果。'

  return {
    ...buildPersistedVehicleAssistResult(entity, 'cache-hit', runtimeConfig, {
      resultStatus: 'cache-hit',
      refreshRecommended,
      degraded: entity.source !== 'api',
    }),
    cached: true,
    notice: mergeNotice(cacheNotice, entity.notice),
  }
}

// 当本次实时分析失败时，回退到最近一次成功结果。
function buildRecoveredVehicleAssistResult(
  entity: VehicleAiAnalysisEntity,
  runtimeConfig: AiRuntimeConfigView,
  requestMode: AiRequestMode,
  failureCode: AiFailureCode,
  notice: string,
): AiAssistResult {
  return {
    ...buildPersistedVehicleAssistResult(entity, requestMode, runtimeConfig, {
      resultStatus: 'last-success-fallback',
      refreshRecommended: shouldRecommendRefresh(failureCode),
      degraded: true,
      failureCode,
    }),
    cached: true,
    notice: mergeNotice('本次实时分析失败，已回退到最近一次成功结果。', notice),
  }
}

// 统一构建车辆 AI 的运行时元信息，方便前端做状态展示与面试讲解。
function createVehicleAiRuntimeMeta(
  runtimeConfig: AiRuntimeConfigView,
  options: {
    requestMode: AiRequestMode
    resultStatus: AiResultStatus
    refreshRecommended: boolean
    degraded: boolean
    failureCode?: AiFailureCode
  },
): AiRuntimeMeta {
  return {
    provider: 'OpenAI Compatible',
    model: runtimeConfig.model,
    endpointLabel: runtimeConfig.endpointLabel,
    cacheLayer: 'PostgreSQL',
    cacheEnabled: runtimeConfig.enableCache,
    manualRefreshEnabled: runtimeConfig.allowManualRefresh,
    requestMode: options.requestMode,
    resultStatus: options.resultStatus,
    timeoutMs: runtimeConfig.requestTimeoutMs,
    storeEnabled: runtimeConfig.openaiStore,
    apiKeyConfigured: runtimeConfig.apiKeyConfigured,
    refreshRecommended: options.refreshRecommended,
    degraded: options.degraded,
    failureCode: options.failureCode,
  }
}

// 合并主提示和次提示文案，避免覆盖有价值的上下文。
function mergeNotice(primaryNotice: string, secondaryNotice?: string) {
  if (!secondaryNotice || secondaryNotice === primaryNotice) {
    return primaryNotice
  }

  return `${primaryNotice} ${secondaryNotice}`
}

// 根据是否手动刷新生成本次请求模式。
function resolveRequestMode(forceRefresh: boolean): AiRequestMode {
  return forceRefresh ? 'force-refresh' : 'fresh-generate'
}

// 根据失败原因判断是否还建议用户重新触发分析。
function shouldRecommendRefresh(failureCode?: AiFailureCode) {
  if (!failureCode) {
    return false
  }

  return !['AI_NO_API_KEY', 'AI_MANUAL_REFRESH_DISABLED'].includes(failureCode)
}

// 判断车辆源数据是否在分析之后发生了变化。
function hasSourceChanged(savedUpdatedAt: string, currentUpdatedAt: string) {
  const savedTimestamp = Date.parse(savedUpdatedAt)
  const currentTimestamp = Date.parse(currentUpdatedAt)

  if (Number.isNaN(savedTimestamp) || Number.isNaN(currentTimestamp)) {
    return savedUpdatedAt !== currentUpdatedAt
  }

  return savedTimestamp !== currentTimestamp
}

// 调用 OpenAI 接口分析车辆档案。
async function requestOpenAiVehicleAssist(
  dto: VehicleAiAssistDto,
  runtimeConfig: AiRuntimeConfigView,
): Promise<OpenAiNormalizedResult> {
  const client = createOpenAiClient(runtimeConfig)

  const response = (await client.responses.create({
    model: runtimeConfig.model,
    store: runtimeConfig.openaiStore,
    instructions: [
      '你是一个后台管理系统中的车辆档案分析助手。',
      '请根据车辆基础档案生成中文结果。',
      '输出聚焦三个部分：摘要、异常或风险提示、下一步建议。',
      '如果字段缺失、状态异常或录入不一致，请优先指出。',
      '尽量返回 JSON，字段为 summary、risks、nextActions、confidence。',
    ].join(' '),
    input: JSON.stringify(dto),
    text: {
      format: {
        type: 'text',
      },
    },
    max_output_tokens: 800,
  })) as { output_text?: string }

  const outputText = typeof response.output_text === 'string' ? response.output_text.trim() : ''

  if (!outputText) {
    throw new AppError('AI 返回内容为空，无法生成车辆分析结果。', 502, 'AI_EMPTY_OUTPUT')
  }

  return normalizeModelOutput(outputText)
}

// 兼容模型返回的 JSON 或普通文本格式。
function normalizeModelOutput(outputText: string): OpenAiNormalizedResult {
  const parsed = tryParseJson(outputText)

  if (parsed) {
    return parsed
  }

  const lines = outputText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    throw new AppError('AI 返回内容无法解析为有效结果。', 502, 'AI_INVALID_OUTPUT')
  }

  const summary = lines.slice(0, 3)
  const risks = lines.filter((line) => /风险|异常|问题|缺失/i.test(line)).slice(0, 4)
  const nextActions = lines.filter((line) => /建议|下一步|处理|补充/i.test(line)).slice(0, 4)

  return {
    summary,
    risks,
    nextActions,
    confidence: 'medium',
  }
}

// 尝试从模型输出中解析结构化 JSON。
function tryParseJson(outputText: string): OpenAiNormalizedResult | null {
  const candidates = [
    outputText,
    outputText
      .replace(/^```json\s*/i, '')
      .replace(/```$/i, '')
      .trim(),
  ]

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Partial<OpenAiNormalizedResult>

      if (parsed && typeof parsed === 'object') {
        const summary = Array.isArray(parsed.summary) ? parsed.summary.filter(isNonEmptyString) : []
        const risks = Array.isArray(parsed.risks) ? parsed.risks.filter(isNonEmptyString) : []
        const nextActions = Array.isArray(parsed.nextActions)
          ? parsed.nextActions.filter(isNonEmptyString)
          : []

        if (summary.length === 0 && risks.length === 0 && nextActions.length === 0) {
          continue
        }

        return {
          summary,
          risks,
          nextActions,
          confidence: ['low', 'medium', 'high'].includes(String(parsed.confidence))
            ? (parsed.confidence as AiConfidence)
            : 'medium',
        }
      }
    } catch {
      // 继续尝试其他变体。
    }
  }

  return null
}

// 规范化 AI 成功结果，避免出现空数组或无效置信度。
function sanitizeAiAssistResult(
  result: OpenAiNormalizedResult,
  source: 'api' | 'mock' | 'fallback',
  runtimeConfig: AiRuntimeConfigView,
  options: {
    requestMode: AiRequestMode
    resultStatus: AiResultStatus
    degraded: boolean
    failureCode?: AiFailureCode
  },
): AiAssistResult {
  const summary = result.summary.filter(isNonEmptyString).slice(0, 6)
  const risks = result.risks.filter(isNonEmptyString).slice(0, 6)
  const nextActions = result.nextActions.filter(isNonEmptyString).slice(0, 5)
  const confidence: AiConfidence = ['low', 'medium', 'high'].includes(result.confidence)
    ? result.confidence
    : 'medium'

  return {
    summary: summary.length ? summary : ['当前车辆档案已完成分析，但没有返回有效摘要。'],
    risks: risks.length ? risks : ['暂未发现明显异常，但仍建议人工核对关键字段。'],
    nextActions: nextActions.length ? nextActions : ['建议人工复核车辆关键档案后再进行业务使用。'],
    confidence,
    source,
    cached: false,
    generatedAt: new Date().toISOString(),
    notice: source === 'api' ? '当前结果由 OpenAI 接口生成。' : undefined,
    runtime: createVehicleAiRuntimeMeta(runtimeConfig, {
      requestMode: options.requestMode,
      resultStatus: options.resultStatus,
      refreshRecommended: false,
      degraded: options.degraded,
      failureCode: options.failureCode,
    }),
  }
}

// 将异常映射为统一的 AI 失败原因码。
function resolveAiFailureCode(error: unknown): AiFailureCode {
  if (error instanceof AppError && error.errorCode) {
    return error.errorCode as AiFailureCode
  }

  const message = error instanceof Error ? error.message : String(error ?? '')

  if (/timeout|timed out|aborted|超时/i.test(message)) {
    return 'AI_TIMEOUT'
  }

  if (/invalid output|无法解析|parse|json/i.test(message)) {
    return 'AI_INVALID_OUTPUT'
  }

  return 'AI_PROVIDER_ERROR'
}

// 根据失败原因生成更适合前端展示的提示文案。
function resolveAiFailureNotice(failureCode: AiFailureCode) {
  switch (failureCode) {
    case 'AI_NO_API_KEY':
      return '当前未配置 OPENAI_API_KEY，系统已切换为规则兜底结果。'
    case 'AI_TIMEOUT':
      return 'AI 请求超时，系统已自动切换为规则兜底结果。'
    case 'AI_EMPTY_OUTPUT':
      return 'AI 返回内容为空，系统已自动切换为规则兜底结果。'
    case 'AI_INVALID_OUTPUT':
      return 'AI 返回格式无法解析，系统已自动切换为规则兜底结果。'
    case 'AI_SAVE_FAILED':
      return 'AI 结果生成成功，但保存失败，系统已回退到最近一次成功结果。'
    case 'AI_MANUAL_REFRESH_DISABLED':
      return '当前配置已关闭手动重新分析。'
    default:
      return 'AI 服务暂时不可用，系统已自动切换为规则兜底结果。'
  }
}

// 持久化 AI 结果，并在需要时回退到最近一次成功结果。
async function persistVehicleAssistResult(
  vehicle: VehicleAiAssistDto,
  savedAnalysis: VehicleAiAnalysisEntity | null,
  context: VehicleAiOperationContext,
  result: AiAssistResult,
  runtimeConfig: AiRuntimeConfigView,
  requestMode: AiRequestMode,
  resultStatus: AiResultStatus,
  failureCode?: AiFailureCode,
): Promise<AiAssistResult> {
  const persistedAnalysis = await upsertVehicleAiAnalysis(vehicle.id, result, vehicle.updatedAt)

  if (!persistedAnalysis) {
    if (savedAnalysis) {
      const recoveredResult = buildRecoveredVehicleAssistResult(
        savedAnalysis,
        runtimeConfig,
        requestMode,
        'AI_SAVE_FAILED',
        resolveAiFailureNotice('AI_SAVE_FAILED'),
      )

      await createVehicleAiAuditLog({
        context,
        vehicle,
        beforeData: savedAnalysis,
        afterData: recoveredResult,
      })

      return recoveredResult
    }

    throw new AppError('保存车辆 AI 分析结果失败。', 500, 'AI_SAVE_FAILED')
  }

  await createVehicleAiAuditLog({
    context,
    vehicle,
    beforeData: savedAnalysis ?? undefined,
    afterData: persistedAnalysis,
  })

  return buildPersistedVehicleAssistResult(persistedAnalysis, requestMode, runtimeConfig, {
    resultStatus,
    refreshRecommended: false,
    degraded: resultStatus !== 'api-success',
    failureCode,
  })
}

// 写入车辆 AI 分析相关审计日志。
async function createVehicleAiAuditLog(options: {
  context: VehicleAiOperationContext
  vehicle: VehicleAiAssistDto
  beforeData?: unknown
  afterData?: unknown
}) {
  await createAuditLog({
    module: 'vehicleAi',
    action: 'analyze',
    entityId: options.vehicle.id,
    entityName: options.vehicle.plateNumber,
    beforeData: options.beforeData,
    afterData: options.afterData,
    operatorId: options.context.operatorId,
    operatorName: options.context.operatorName,
    requestId: options.context.requestId,
  })
}

// 根据车辆档案字段构建异常和风险提示。
function buildVehicleRisks(dto: VehicleAiAssistDto) {
  const risks: string[] = []

  if (dto.flags.suspiciousPlateNumber) {
    risks.push('车牌号格式看起来不够规范，建议核对是否符合统一录入规则。')
  }

  if (dto.flags.missingVin) {
    risks.push('车架号缺失，会影响资产识别、追溯和后续校验。')
  }

  if (dto.flags.missingBrandModel) {
    risks.push('品牌型号未填写完整，可能影响调度和车型匹配。')
  }

  if (dto.flags.missingAxleCount) {
    risks.push('轴数缺失，可能影响车辆能力评估和台账完整性。')
  }

  if (dto.flags.missingLoadCapacity) {
    risks.push('核载吨位缺失，不利于后续运力分析和派单判断。')
  }

  if (dto.flags.maintenanceStatus) {
    risks.push('车辆当前状态为维修中，若继续参与调度可能存在业务风险。')
  }

  if (dto.flags.inactiveStatus) {
    risks.push('车辆当前状态为停用，建议确认是否仍应保留在可用台账中。')
  }

  if (dto.flags.staleRecord) {
    risks.push('该车辆档案较长时间未更新，当前状态可能已经过期。')
  }

  if (dto.flags.emptyRemark) {
    risks.push('备注为空，若存在特殊限制或背景信息，当前档案无法体现。')
  }

  if (risks.length === 0) {
    risks.push('未发现明显异常录入，当前车辆档案完整度较好。')
  }

  return risks
}

// 根据风险情况生成下一步建议。
function buildVehicleNextActions(dto: VehicleAiAssistDto, riskCount: number) {
  const nextActions: string[] = []

  if (dto.flags.missingVin || dto.flags.missingBrandModel) {
    nextActions.push('优先补齐车架号和品牌型号，提升车辆主数据的可追溯性。')
  }

  if (dto.flags.missingAxleCount || dto.flags.missingLoadCapacity) {
    nextActions.push('补录轴数和核载吨位，避免后续运力分析出现偏差。')
  }

  if (dto.flags.maintenanceStatus || dto.flags.inactiveStatus) {
    nextActions.push('联系当前负责人确认车辆状态，避免维修中或停用车辆误参与业务流程。')
  }

  if (dto.flags.staleRecord) {
    nextActions.push('建议重新核对并刷新该档案，确保状态与实际车辆一致。')
  }

  if (riskCount <= 1) {
    nextActions.push('当前档案可作为较好的演示样例，但正式使用前仍建议人工复核。')
  }

  if (nextActions.length === 0) {
    nextActions.push('建议保持车辆状态、档案字段和审计留痕同步更新。')
  }

  return nextActions
}

// 根据风险数量给出大致置信度。
function resolveConfidence(dto: VehicleAiAssistDto, riskCount: number): AiConfidence {
  if (dto.flags.staleRecord || riskCount >= 4) {
    return 'low'
  }

  if (riskCount >= 2 || dto.flags.maintenanceStatus || dto.flags.inactiveStatus) {
    return 'medium'
  }

  return 'high'
}

// 判断字符串是否为有效非空文本。
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
