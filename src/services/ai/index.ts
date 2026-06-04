import { generateTruckAssistApi } from '@/api/ai'
import type { AiAssistResult, TruckAiAssistDto } from './types'

const ASSIST_TIMEOUT_MS = 5000
const CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry {
  expiresAt: number
  result: AiAssistResult
}

// 当前浏览器会话内的内存缓存。
const truckAssistCache = new Map<string, CacheEntry>()

// 对外入口：先查缓存，再请求后端接口，最后兜底到本地规则结果。
export async function generateTruckAssist(dto: TruckAiAssistDto) {
  const cacheKey = createTruckAssistCacheKey(dto)
  const cachedEntry = truckAssistCache.get(cacheKey)

  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return {
      ...cachedEntry.result,
      cached: true,
    }
  }

  try {
    const result = await withTimeout(generateTruckAssistApi(dto), ASSIST_TIMEOUT_MS)
    const nextResult = {
      ...result,
      cached: false,
    }

    truckAssistCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      result: nextResult,
    })

    return nextResult
  } catch {
    return buildFallbackTruckAssist(dto)
  }
}

// 只用会影响输出结果的业务字段来生成缓存 key。
function createTruckAssistCacheKey(dto: TruckAiAssistDto) {
  return JSON.stringify({
    id: dto.id,
    truckType: dto.truckType,
    tractorLicensePlateNo: dto.tractorLicensePlateNo,
    trailerLicensePlateNo: dto.trailerLicensePlateNo,
    truckModel: dto.truckModel,
    whiteTruckLabel: dto.whiteTruckLabel,
    powerType: dto.powerType,
    updatedBy: dto.updatedBy,
    updatedAt: dto.updatedAt,
    flags: dto.flags,
    metrics: dto.metrics,
  })
}

// 给异步生成过程包一层超时，避免页面一直等待。
function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('AI 分析超时，请稍后重试。')), timeoutMs)

    promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer)
        reject(error)
      })
  })
}

// 前端本地兜底：即使后端不可用，也能保证页面继续展示。
function buildFallbackTruckAssist(dto: TruckAiAssistDto): AiAssistResult {
  return {
    summary: [
      `当前已成功加载这条${dto.truckType}车辆记录。`,
      `基础识别信息包括车头 ${dto.tractorLicensePlateNo || '未知'} 和挂车 ${dto.trailerLicensePlateNo || '未知'}。`,
      'AI 服务暂时不可用，页面已自动切换为本地规则兜底结果。',
    ],
    risks: buildTruckRisks(dto).slice(0, 4),
    nextActions: [
      '可以稍后重新触发 AI 分析，或先使用当前结果完成演示。',
      '如果后端服务未启动，请先运行 Express 服务端。',
    ],
    confidence: 'medium',
    source: 'fallback',
    cached: false,
    generatedAt: new Date().toISOString(),
    notice: '当前处于前端兜底模式，主业务流程不会被 AI 失败阻塞。',
  }
}

function buildTruckRisks(dto: TruckAiAssistDto) {
  const risks: string[] = []

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
