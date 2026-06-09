import OpenAI from 'openai'
import { env } from '../../config/env.ts'
import type { AiAssistResult, AiConfidence, TruckAiAssistDto } from '../../types/ai.ts'

type OpenAiNormalizedResult = Pick<
  AiAssistResult,
  'summary' | 'risks' | 'nextActions' | 'confidence'
>

let openaiClient: OpenAI | null = null

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

export async function generateTruckAssistResult(dto: TruckAiAssistDto): Promise<AiAssistResult> {
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
      notice:
        'The real AI service is temporarily unavailable, so the server returned a rule-based fallback result.',
      source: 'fallback',
      cached: false,
    }
  }
}

async function requestOpenAiTruckAssist(dto: TruckAiAssistDto): Promise<OpenAiNormalizedResult> {
  const client = getOpenAiClient()

  const response = (await client.responses.create({
    model: env.openaiModel,
    store: env.openaiStore,
    instructions: [
      'You are an assistant that analyzes vehicle detail records in an enterprise dashboard.',
      'Return summary points, risk tips, next actions, and confidence.',
      'Prefer strict JSON with summary, risks, nextActions, and confidence fields.',
      'If strict JSON is not possible, return readable plain text.',
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
  const risks = lines.filter((line) => /risk|issue|warning|abnormal/i.test(line)).slice(0, 4)
  const nextActions = lines
    .filter((line) => /action|next step|suggest|check/i.test(line))
    .slice(0, 4)

  return {
    summary: summary.length
      ? summary
      : ['The AI returned text, but no structured summary could be extracted.'],
    risks: risks.length ? risks : ['Please manually review the AI text for possible risk points.'],
    nextActions: nextActions.length
      ? nextActions
      : ['Please manually review the current result and decide whether to regenerate it.'],
    confidence: 'medium',
  }
}

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
      // Keep trying other variants.
    }
  }

  return null
}

function sanitizeAiAssistResult(
  result: OpenAiNormalizedResult,
  source: 'api' | 'mock' | 'fallback',
): AiAssistResult {
  const summary = result.summary.filter(isNonEmptyString).slice(0, 6)
  const risks = result.risks.filter(isNonEmptyString).slice(0, 6)
  const nextActions = result.nextActions.filter(isNonEmptyString).slice(0, 5)
  const confidence: AiConfidence = ['low', 'medium', 'high'].includes(result.confidence)
    ? result.confidence
    : 'medium'

  return {
    summary: summary.length
      ? summary
      : ['The current record was analyzed, but no summary was returned.'],
    risks: risks.length
      ? risks
      : ['No obvious risk was identified. Please still verify the record against business rules.'],
    nextActions: nextActions.length
      ? nextActions
      : ['Review the key vehicle fields manually before using the result.'],
    confidence,
    source,
    cached: false,
    generatedAt: new Date().toISOString(),
    notice: source === 'api' ? 'This result was generated by the official OpenAI API.' : undefined,
  }
}

function buildMockTruckAssist(dto: TruckAiAssistDto): AiAssistResult {
  const summary = [
    `This record belongs to truck ${dto.tractorLicensePlateNo || 'unknown plate'} and can be used for a basic operations check.`,
    `The record is marked as ${dto.whiteTruckLabel}, and the power type is ${dto.powerType}.`,
    dto.metrics.daysSinceUpdate == null
      ? 'The last update time is missing, so record freshness cannot be confirmed.'
      : `The record was last updated ${dto.metrics.daysSinceUpdate} days ago by ${dto.updatedBy}.`,
  ]

  if (dto.truckModel && dto.truckModel !== '-') {
    summary.push(
      `The truck model is ${dto.truckModel}, which helps dispatch confirm the asset quickly.`,
    )
  }

  if (dto.metrics.consumption != null) {
    summary.push(
      `Fuel consumption ${dto.metrics.consumption} is present and can support follow-up efficiency analysis.`,
    )
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
      ? 'This response comes from server-side rule logic.'
      : 'OPENAI_API_KEY is not configured, so the server returned a mock result.',
  }
}

function buildTruckRisks(dto: TruckAiAssistDto) {
  const risks: string[] = []

  if (dto.flags.missingTractorPlate) {
    risks.push(
      'The tractor plate is missing, which makes dispatch confirmation and audit tracing harder.',
    )
  }

  if (dto.flags.missingTrailerPlate) {
    risks.push('The trailer plate is missing, so vehicle matching may fail during handoff.')
  }

  if (dto.flags.missingModel) {
    risks.push('The truck model is missing, which lowers matching accuracy for operations.')
  }

  if (dto.flags.whiteListMissingCode) {
    risks.push(
      'The whitelist flag is on, but the whitelist code is empty, so rule validation may be inconsistent.',
    )
  }

  if (dto.flags.fuelConsumptionMissing) {
    risks.push(
      'Fuel consumption is missing, which limits later efficiency analysis and troubleshooting.',
    )
  }

  if (dto.flags.staleRecord) {
    risks.push('The record has not been updated for a long time and may be stale.')
  }

  if (dto.flags.missingUpdateOwner) {
    risks.push('The latest updater is unknown, so ownership and accountability are weaker.')
  }

  if (dto.flags.highUnknownFieldRatio) {
    risks.push(
      'Too many key fields are incomplete, so this record should not be treated as highly reliable master data.',
    )
  }

  if (risks.length === 0) {
    risks.push(
      'No obvious structural risk was found, but a quick manual check is still recommended before dispatch.',
    )
  }

  return risks
}

function buildTruckNextActions(dto: TruckAiAssistDto, riskCount: number) {
  const nextActions: string[] = []

  if (dto.flags.missingTractorPlate || dto.flags.missingTrailerPlate) {
    nextActions.push('Fill in the missing plate information before the dispatch flow continues.')
  }

  if (dto.flags.whiteListMissingCode) {
    nextActions.push(
      'Confirm the whitelist status with operations and add the missing whitelist code if needed.',
    )
  }

  if (dto.flags.missingModel || dto.flags.fuelConsumptionMissing) {
    nextActions.push(
      'Complete the model and fuel consumption fields to improve later analysis quality.',
    )
  }

  if (dto.flags.staleRecord) {
    nextActions.push(
      'Ask the current owner to re-check this vehicle profile because the update is old.',
    )
  }

  if (riskCount <= 1) {
    nextActions.push(
      'This record is suitable for a quick manual review and also works well as a demo example.',
    )
  }

  if (nextActions.length === 0) {
    nextActions.push(
      'Keep the latest certificate and dispatch status synchronized so the record stays reusable.',
    )
  }

  return nextActions
}

function resolveConfidence(dto: TruckAiAssistDto, riskCount: number): AiConfidence {
  if (dto.flags.highUnknownFieldRatio || riskCount >= 4) {
    return 'low'
  }

  if (riskCount >= 2 || dto.flags.staleRecord) {
    return 'medium'
  }

  return 'high'
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
