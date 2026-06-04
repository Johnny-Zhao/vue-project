import OpenAI from 'openai'
import { env } from '../../config/env.js'

let openaiClient = null

function getOpenAiClient() {
  if (openaiClient) {
    return openaiClient
  }

  openaiClient = new OpenAI({
    apiKey: env.openaiApiKey,
    timeout: env.openaiTimeoutMs,
  })

  return openaiClient
}

export async function generateTruckAssistResult(dto) {
  if (!env.openaiApiKey) {
    return buildMockTruckAssist(dto)
  }

  try {
    const result = await requestOpenAiTruckAssist(dto)
    return sanitizeAiAssistResult(result, 'api')
  } catch (error) {
    console.warn('[ai] official openai request failed, fallback to mock result:', error)

    return {
      ...buildMockTruckAssist(dto),
      notice: '真实 AI 暂时不可用，已自动切换为服务端规则结果。',
      source: 'fallback',
      cached: false,
    }
  }
}

async function requestOpenAiTruckAssist(dto) {
  const client = getOpenAiClient()

  const response = await client.responses.create({
    model: env.openaiModel,
    store: env.openaiStore,
    instructions: [
      '你是企业后台里的车辆详情分析助手。',
      '请基于输入数据输出摘要、风险点、下一步建议和置信度。',
      '优先返回 JSON，字段为 summary、risks、nextActions、confidence。',
      '如果无法严格返回 JSON，也至少返回可读文本。',
    ].join(''),
    input: JSON.stringify(dto),
    text: {
      format: {
        type: 'text',
      },
    },
    max_output_tokens: 800,
  })

  const outputText = typeof response.output_text === 'string' ? response.output_text.trim() : ''

  if (!outputText) {
    throw new Error('Official OpenAI response does not contain output_text.')
  }

  return normalizeModelOutput(outputText)
}

function normalizeModelOutput(outputText) {
  const parsed = tryParseJson(outputText)

  if (parsed) {
    return parsed
  }

  const lines = outputText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const summary = lines.slice(0, 3)
  const risks = lines.filter((line) => /风险|risk|异常|问题/i.test(line)).slice(0, 4)
  const nextActions = lines.filter((line) => /建议|action|下一步|处理/i.test(line)).slice(0, 4)

  return {
    summary: summary.length ? summary : ['AI 已返回文本结果，但未识别出标准摘要结构。'],
    risks: risks.length ? risks : ['请人工检查 AI 返回文本中的潜在风险点。'],
    nextActions: nextActions.length
      ? nextActions
      : ['建议人工复核当前结果，并决定是否需要重新生成。'],
    confidence: 'medium',
  }
}

function tryParseJson(outputText) {
  const candidates = [
    outputText,
    outputText
      .replace(/^```json\s*/i, '')
      .replace(/```$/i, '')
      .trim(),
  ]

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)

      if (parsed && typeof parsed === 'object') {
        return parsed
      }
    } catch {
      // Keep trying other text variants.
    }
  }

  return null
}

function sanitizeAiAssistResult(result, source) {
  const summary = Array.isArray(result.summary)
    ? result.summary.filter(isNonEmptyString).slice(0, 6)
    : []
  const risks = Array.isArray(result.risks) ? result.risks.filter(isNonEmptyString).slice(0, 6) : []
  const nextActions = Array.isArray(result.nextActions)
    ? result.nextActions.filter(isNonEmptyString).slice(0, 5)
    : []
  const confidence = ['low', 'medium', 'high'].includes(result.confidence)
    ? result.confidence
    : 'medium'

  return {
    summary: summary.length ? summary : ['当前记录已完成 AI 分析，但摘要内容为空。'],
    risks: risks.length ? risks : ['当前未识别到明显风险，请结合业务规则继续确认。'],
    nextActions: nextActions.length ? nextActions : ['建议人工复核当前车辆记录的关键字段。'],
    confidence,
    source,
    cached: false,
    generatedAt: new Date().toISOString(),
    notice: source === 'api' ? '当前结果来自官方 OpenAI 接口。' : undefined,
  }
}

function buildMockTruckAssist(dto) {
  const summary = [
    `当前记录对应车头牌照 ${dto.tractorLicensePlateNo || '未知牌照'}，可以用于基础运营核对。`,
    `车辆当前标记为 ${dto.whiteTruckLabel} 白名单，动力类型为 ${dto.powerType}。`,
    dto.metrics.daysSinceUpdate == null
      ? '由于缺少更新时间，暂时无法判断这条记录是否足够新。'
      : `该记录最近一次更新距今 ${dto.metrics.daysSinceUpdate} 天，更新人是 ${dto.updatedBy}。`,
  ]

  if (dto.truckModel && dto.truckModel !== '-') {
    summary.push(`当前车辆型号为 ${dto.truckModel}，有助于调度快速确认车辆资产。`)
  }

  if (dto.metrics.consumption != null) {
    summary.push(`当前记录包含油耗值 ${dto.metrics.consumption}，可用于后续效率对比。`)
  }

  const risks = buildTruckRisks(dto)
  const nextActions = buildTruckNextActions(dto, risks.length)

  return {
    summary: summary.slice(0, 5),
    risks: risks.slice(0, 6),
    nextActions: nextActions.slice(0, 5),
    confidence: resolveConfidence(dto, risks.length),
    source: 'mock',
    cached: false,
    generatedAt: new Date().toISOString(),
    notice: env.openaiApiKey
      ? '当前使用的是服务端规则结果。'
      : '尚未配置 OPENAI_API_KEY，当前使用的是服务端 mock 结果。',
  }
}

function buildTruckRisks(dto) {
  const risks = []

  if (dto.flags.missingTractorPlate) {
    risks.push('车头牌照缺失，会增加调度确认和审计追踪的难度。')
  }

  if (dto.flags.missingTrailerPlate) {
    risks.push('挂车牌照缺失，车辆配对校验在交接时可能失败。')
  }

  if (dto.flags.missingModel) {
    risks.push('车辆型号未填写，会降低运营侧进行设备匹配的准确性。')
  }

  if (dto.flags.whiteListMissingCode) {
    risks.push('白名单标记已开启，但白名单编号为空，策略校验可能不一致。')
  }

  if (dto.flags.fuelConsumptionMissing) {
    risks.push('油耗数据缺失，会限制后续效率分析和异常排查。')
  }

  if (dto.flags.staleRecord) {
    risks.push('记录长时间未更新，当前运营状态可能已经过期。')
  }

  if (dto.flags.missingUpdateOwner) {
    risks.push('最近更新人未知，会削弱当前记录状态的责任归属。')
  }

  if (dto.flags.highUnknownFieldRatio) {
    risks.push('多个关键字段不完整，这条记录暂时不应视为高可信主数据。')
  }

  if (risks.length === 0) {
    risks.push('当前车辆档案未发现明显结构性风险，但正式调度前仍建议做一次业务确认。')
  }

  return risks
}

function buildTruckNextActions(dto, riskCount) {
  const nextActions = []

  if (dto.flags.missingTractorPlate || dto.flags.missingTrailerPlate) {
    nextActions.push('在进入调度流程前，先补齐缺失的车牌信息。')
  }

  if (dto.flags.whiteListMissingCode) {
    nextActions.push('与运营侧确认白名单状态，如果继续保留白名单，请补齐对应编号。')
  }

  if (dto.flags.missingModel || dto.flags.fuelConsumptionMissing) {
    nextActions.push('补充车辆型号和油耗字段，提升后续分析和对比结果的可靠性。')
  }

  if (dto.flags.staleRecord) {
    nextActions.push('联系当前负责人重新确认车辆档案，因为最近更新时间已经较久。')
  }

  if (riskCount <= 1) {
    nextActions.push('这条记录适合做一次快速人工复核，也适合作为演示样例。')
  }

  if (nextActions.length === 0) {
    nextActions.push('持续同步最新证件状态和调度状态，保证车辆档案可直接复用。')
  }

  return nextActions
}

function resolveConfidence(dto, riskCount) {
  if (dto.flags.highUnknownFieldRatio || riskCount >= 4) {
    return 'low'
  }

  if (riskCount >= 2 || dto.flags.staleRecord) {
    return 'medium'
  }

  return 'high'
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}
