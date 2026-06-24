export type AiConfidence = 'low' | 'medium' | 'high'
export type AiSource = 'api' | 'mock' | 'fallback'
export type AiRequestMode = 'cache-hit' | 'fresh-generate' | 'force-refresh'

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
  timeoutMs: number
  storeEnabled: boolean
  apiKeyConfigured: boolean
  refreshRecommended: boolean
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
