export interface AiRuntimeConfigItem {
  id: number
  model: string
  requestTimeoutMs: number
  enableCache: boolean
  allowManualRefresh: boolean
  suggestRefreshOnSourceChange: boolean
  openaiStore: boolean
  updatedAt: string
  updatedById: number
  updatedByName: string
  apiKeyConfigured: boolean
  endpointLabel: string
}

export type AiFeedbackType = 'helpful' | 'inaccurate' | 'retry'

export interface AiFeedbackStatsItem {
  helpfulCount: number
  inaccurateCount: number
  retryCount: number
  latestFeedbackAt: string | null
  latestVehicleId: number | null
  latestVehiclePlateNumber: string
  latestFeedbackType: AiFeedbackType | null
}

export interface UpdateAiRuntimeConfigPayload {
  model: string
  requestTimeoutMs: number
  enableCache: boolean
  allowManualRefresh: boolean
  suggestRefreshOnSourceChange: boolean
  openaiStore: boolean
}
