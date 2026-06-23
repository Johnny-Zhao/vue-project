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

export interface UpdateAiRuntimeConfigPayload {
  model: string
  requestTimeoutMs: number
  enableCache: boolean
  allowManualRefresh: boolean
  suggestRefreshOnSourceChange: boolean
  openaiStore: boolean
}
