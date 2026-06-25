export interface AiRuntimeConfigEntity {
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
}

export interface AiRuntimeConfigRow {
  id: number | string
  model: string
  requestTimeoutMs: number | string
  enableCache: boolean
  allowManualRefresh: boolean
  suggestRefreshOnSourceChange: boolean
  openaiStore: boolean
  updatedAt: string
  updatedById: number | string
  updatedByName: string
}

export interface AiRuntimeConfigView extends AiRuntimeConfigEntity {
  apiKeyConfigured: boolean
  endpointLabel: string
}

export interface AiFeedbackStatsEntity {
  helpfulCount: number
  inaccurateCount: number
  retryCount: number
  latestFeedbackAt: string | null
  latestVehicleId: number | null
  latestVehiclePlateNumber: string
  latestFeedbackType: import('./ai.ts').VehicleAiFeedbackType | null
}

export interface AiFeedbackStatsRow {
  helpfulCount: number | string
  inaccurateCount: number | string
  retryCount: number | string
  latestFeedbackAt: string | null
  latestVehicleId: number | string | null
  latestVehiclePlateNumber: string | null
  latestFeedbackType: import('./ai.ts').VehicleAiFeedbackType | null
}

export interface UpdateAiRuntimeConfigPayload {
  model: string
  requestTimeoutMs: number
  enableCache: boolean
  allowManualRefresh: boolean
  suggestRefreshOnSourceChange: boolean
  openaiStore: boolean
}
