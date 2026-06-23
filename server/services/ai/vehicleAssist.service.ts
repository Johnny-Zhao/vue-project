import OpenAI from 'openai'
import { env } from '../../config/env.ts'
import { createAuditLog } from '../../pg/repositories/auditLog.repository.ts'
import {
  findVehicleAiAnalysisByVehicleId,
  upsertVehicleAiAnalysis,
} from '../../pg/repositories/vehicleAiAnalysis.repository.ts'
import type {
  AiAssistResult,
  AiConfidence,
  AiRequestMode,
  AiRuntimeMeta,
  VehicleAiAnalysisEntity,
  VehicleAiAssistDto,
  VehicleAiAssistRequestDto,
} from '../../types/ai.ts'
import type { AiRuntimeConfigView } from '../../types/aiConfig.ts'
import { AppError } from '../../utils/appError.ts'
import { getAiRuntimeConfigSnapshot } from '../aiConfig.service.ts'

type OpenAiNormalizedResult = Pick<
  AiAssistResult,
  'summary' | 'risks' | 'nextActions' | 'confidence'
>

interface VehicleAiOperationContext {
  operatorId: number
  operatorName: string
  requestId: string
}

// 为当前请求创建 OpenAI 客户端，确保运行时配置修改后立即生效。
function createOpenAiClient(runtimeConfig: AiRuntimeConfigView) {
  return new OpenAI({
    apiKey: env.openaiApiKey,
    timeout: runtimeConfig.requestTimeoutMs,
    baseURL: env.openaiBaseUrl || undefined,
  })
}

// 读取或生成车辆档案 AI 分析结果，并在需要时保存到数据库。
export async function getVehicleAssistResult(
  payload: VehicleAiAssistRequestDto,
  context: VehicleAiOperationContext,
): Promise<AiAssistResult> {
  const { vehicle, forceRefresh = false } = payload
  const runtimeConfig = await getAiRuntimeConfigSnapshot()
  const savedAnalysis = await findVehicleAiAnalysisByVehicleId(vehicle.id)

  if (forceRefresh && !runtimeConfig.allowManualRefresh) {
    throw new AppError('当前 AI 配置已关闭手动重新分析，请前往 AI 配置管理页面开启后再试。', 400)
  }

  if (runtimeConfig.enableCache && savedAnalysis && !forceRefresh) {
    return buildCachedVehicleAssistResult(savedAnalysis, vehicle, runtimeConfig)
  }

  const generatedResult = await generateVehicleAssistResult(vehicle, runtimeConfig)
  const persistedAnalysis = await upsertVehicleAiAnalysis(
    vehicle.id,
    generatedResult,
    vehicle.updatedAt,
  )

  if (!persistedAnalysis) {
    throw new AppError('保存车辆 AI 分析结果失败。', 500)
  }

  await createAuditLog({
    module: 'vehicleAi',
    action: 'analyze',
    entityId: vehicle.id,
    entityName: vehicle.plateNumber,
    beforeData: savedAnalysis ?? undefined,
    afterData: persistedAnalysis,
    operatorId: context.operatorId,
    operatorName: context.operatorName,
    requestId: context.requestId,
  })

  return buildPersistedVehicleAssistResult(
    persistedAnalysis,
    forceRefresh ? 'force-refresh' : 'fresh-generate',
    runtimeConfig,
  )
}

// 生成车辆档案的 AI 摘要与异常识别结果。
export async function generateVehicleAssistResult(
  dto: VehicleAiAssistDto,
  runtimeConfig: AiRuntimeConfigView,
): Promise<AiAssistResult> {
  if (!runtimeConfig.apiKeyConfigured) {
    return buildMockVehicleAssist(dto, runtimeConfig)
  }

  try {
    const result = await requestOpenAiVehicleAssist(dto, runtimeConfig)
    return sanitizeAiAssistResult(result, 'api', runtimeConfig)
  } catch (error) {
    console.warn('[ai] official vehicle assist request failed, fallback to mock result:', error)

    return {
      ...buildMockVehicleAssist(dto, runtimeConfig),
      notice: '当前 AI 服务暂时不可用，系统已自动切换到规则兜底结果。',
      source: 'fallback',
      cached: false,
      runtime: createVehicleAiRuntimeMeta(runtimeConfig, {
        requestMode: 'fresh-generate',
        refreshRecommended: false,
      }),
    }
  }
}

// 将数据库中的分析记录转换为接口返回结构。
function buildPersistedVehicleAssistResult(
  entity: VehicleAiAnalysisEntity,
  requestMode: AiRequestMode,
  runtimeConfig: AiRuntimeConfigView,
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
      refreshRecommended: false,
    }),
  }
}

// 将数据库缓存结果转换为接口返回结构，并提示是否建议重新分析。
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
    ...buildPersistedVehicleAssistResult(entity, 'cache-hit', runtimeConfig),
    cached: true,
    notice: mergeNotice(cacheNotice, entity.notice),
    runtime: createVehicleAiRuntimeMeta(runtimeConfig, {
      requestMode: 'cache-hit',
      refreshRecommended,
    }),
  }
}

// 统一构建车辆 AI 的运行元信息，方便前端做状态展示与面试讲解。
function createVehicleAiRuntimeMeta(
  runtimeConfig: AiRuntimeConfigView,
  options: {
    requestMode: AiRequestMode
    refreshRecommended: boolean
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
    timeoutMs: runtimeConfig.requestTimeoutMs,
    storeEnabled: runtimeConfig.openaiStore,
    apiKeyConfigured: runtimeConfig.apiKeyConfigured,
    refreshRecommended: options.refreshRecommended,
  }
}

// 合并缓存提示与历史提示文案。
function mergeNotice(primaryNotice: string, secondaryNotice?: string) {
  if (!secondaryNotice || secondaryNotice === primaryNotice) {
    return primaryNotice
  }

  return `${primaryNotice} ${secondaryNotice}`
}

// 判断车辆源数据是否已经在分析后发生变化。
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
    throw new Error('Official OpenAI response does not contain output_text.')
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

  const summary = lines.slice(0, 3)
  const risks = lines.filter((line) => /风险|异常|问题|缺失/i.test(line)).slice(0, 4)
  const nextActions = lines.filter((line) => /建议|下一步|处理|补充/i.test(line)).slice(0, 4)

  return {
    summary: summary.length ? summary : ['已完成车辆档案分析，但未提取出结构化摘要。'],
    risks: risks.length ? risks : ['请结合业务规则人工复核这条车辆档案。'],
    nextActions: nextActions.length ? nextActions : ['建议人工核对关键字段后再使用该结果。'],
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
        return {
          summary: Array.isArray(parsed.summary) ? parsed.summary.filter(isNonEmptyString) : [],
          risks: Array.isArray(parsed.risks) ? parsed.risks.filter(isNonEmptyString) : [],
          nextActions: Array.isArray(parsed.nextActions)
            ? parsed.nextActions.filter(isNonEmptyString)
            : [],
          confidence: ['low', 'medium', 'high'].includes(String(parsed.confidence))
            ? (parsed.confidence as AiConfidence)
            : 'medium',
        }
      }
    } catch {
      // 继续尝试其他输出变体。
    }
  }

  return null
}

// 规范化 AI 结果，避免出现空数组或无效置信度。
function sanitizeAiAssistResult(
  result: OpenAiNormalizedResult,
  source: 'api' | 'mock' | 'fallback',
  runtimeConfig: AiRuntimeConfigView,
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
      requestMode: 'fresh-generate',
      refreshRecommended: false,
    }),
  }
}

// 构建规则兜底结果，保证无 Key 时也能演示。
function buildMockVehicleAssist(
  dto: VehicleAiAssistDto,
  runtimeConfig: AiRuntimeConfigView,
): AiAssistResult {
  const summary = [
    `车辆 ${dto.plateNumber} 为${dto.vehicleType}，当前状态为${dto.status}。`,
    `该车辆采用${dto.driveType}驱动，能源类型为${dto.energyType}。`,
    dto.brandModel ? `品牌型号为 ${dto.brandModel}。` : '品牌型号尚未补充完整。',
    dto.metrics.daysSinceUpdate == null
      ? '最近更新时间缺失，暂时无法判断档案是否过旧。'
      : `该档案最近一次更新距今 ${dto.metrics.daysSinceUpdate} 天，更新人是 ${dto.updatedBy}。`,
  ]

  const risks = buildVehicleRisks(dto)
  const nextActions = buildVehicleNextActions(dto, risks.length)

  return {
    summary: summary.slice(0, 5),
    risks: risks.slice(0, 6),
    nextActions: nextActions.slice(0, 5),
    confidence: resolveConfidence(dto, risks.length),
    source: 'mock',
    cached: false,
    generatedAt: new Date().toISOString(),
    notice: runtimeConfig.apiKeyConfigured
      ? '当前结果来自服务端规则逻辑。'
      : 'OPENAI_API_KEY 未配置，系统返回了规则兜底结果。',
    runtime: createVehicleAiRuntimeMeta(runtimeConfig, {
      requestMode: 'fresh-generate',
      refreshRecommended: false,
    }),
  }
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
