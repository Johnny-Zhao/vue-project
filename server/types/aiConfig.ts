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

export interface UpdateAiRuntimeConfigPayload {
  model: string
  requestTimeoutMs: number
  enableCache: boolean
  allowManualRefresh: boolean
  suggestRefreshOnSourceChange: boolean
  openaiStore: boolean
}
