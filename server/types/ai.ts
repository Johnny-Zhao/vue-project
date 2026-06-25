export type AiConfidence = 'low' | 'medium' | 'high'
export type AiSource = 'api' | 'mock' | 'fallback'
export type AiRequestMode = 'cache-hit' | 'fresh-generate' | 'force-refresh'
export type AiResultStatus =
  | 'api-success'
  | 'cache-hit'
  | 'mock-generated'
  | 'rule-fallback'
  | 'last-success-fallback'
export type AiFailureCode =
  | 'AI_NO_API_KEY'
  | 'AI_TIMEOUT'
  | 'AI_PROVIDER_ERROR'
  | 'AI_EMPTY_OUTPUT'
  | 'AI_INVALID_OUTPUT'
  | 'AI_SAVE_FAILED'
  | 'AI_MANUAL_REFRESH_DISABLED'

export interface AiAssistResult {
  summary: string[]
  risks: string[]
  nextActions: string[]
  confidence: AiConfidence
  source: AiSource
  cached: boolean
  generatedAt: string
  notice?: string
  runtime?: AiRuntimeMeta
}

export interface AiRuntimeMeta {
  provider: string
  model: string
  endpointLabel: string
  cacheLayer: string
  cacheEnabled: boolean
  manualRefreshEnabled: boolean
  requestMode: AiRequestMode
  resultStatus: AiResultStatus
  timeoutMs: number
  storeEnabled: boolean
  apiKeyConfigured: boolean
  refreshRecommended: boolean
  degraded: boolean
  failureCode?: AiFailureCode
}

export interface VehicleAiAssistRequestDto {
  vehicle: VehicleAiAssistDto
  forceRefresh?: boolean
}

export interface VehicleAssistFlags {
  missingVin: boolean
  missingBrandModel: boolean
  missingAxleCount: boolean
  missingLoadCapacity: boolean
  staleRecord: boolean
  inactiveStatus: boolean
  maintenanceStatus: boolean
  suspiciousPlateNumber: boolean
  emptyRemark: boolean
}

export interface VehicleAssistMetrics {
  loadCapacity: number | null
  daysSinceUpdate: number | null
}

export interface VehicleAiAssistDto {
  id: number
  plateNumber: string
  vehicleType: string
  driveType: string
  energyType: string
  brandModel: string
  vin: string
  axleCount: number | null
  loadCapacity: number | null
  status: string
  remark: string
  updatedBy: string
  updatedAt: string
  flags: VehicleAssistFlags
  metrics: VehicleAssistMetrics
}

export interface VehicleAiAnalysisEntity {
  vehicleId: number
  summary: string[]
  risks: string[]
  nextActions: string[]
  confidence: AiConfidence
  source: AiSource
  generatedAt: string
  notice?: string
  sourceUpdatedAt: string
  createdAt: string
  updatedAt: string
}

export interface VehicleAiAnalysisRow {
  vehicleId: number | string
  summary: unknown
  risks: unknown
  nextActions: unknown
  confidence: AiConfidence
  source: AiSource
  generatedAt: string
  notice?: string | null
  sourceUpdatedAt: string
  createdAt: string
  updatedAt: string
}

export type VehicleAiFeedbackType = 'helpful' | 'inaccurate' | 'retry'

export interface VehicleAiFeedbackPayload {
  vehicleId: number
  feedbackType: VehicleAiFeedbackType
  comment?: string
}

export interface VehicleAiFeedbackEntity {
  id: number
  vehicleId: number
  feedbackType: VehicleAiFeedbackType
  comment: string
  createdAt: string
  createdById: number
  createdByName: string
}

export interface VehicleAiFeedbackRow {
  id: number | string
  vehicleId: number | string
  feedbackType: VehicleAiFeedbackType
  comment: string | null
  createdAt: string
  createdById: number | string
  createdByName: string
}
