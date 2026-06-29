export type VehicleType = 'tractor' | 'truck' | 'trailer' | 'van'
export type VehicleDriveType = '4x2' | '6x4' | '8x4'
export type VehicleEnergyType = 'diesel' | 'lng' | 'electric' | 'hybrid'
export type VehicleStatus = 'active' | 'inactive' | 'maintenance'
export type VehicleSortField =
  | 'id'
  | 'plateNumber'
  | 'vehicleType'
  | 'driveType'
  | 'energyType'
  | 'status'
  | 'createdAt'
  | 'updatedAt'

export interface VehicleItem {
  id: number
  plateNumber: string
  vehicleType: VehicleType
  driveType: VehicleDriveType
  energyType: VehicleEnergyType
  brandModel: string
  vin: string
  axleCount: number | null
  loadCapacity: number | null
  status: VehicleStatus
  remark: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface VehicleListQuery {
  plateNumber?: string
  vehicleType?: VehicleType
  driveType?: VehicleDriveType
  energyType?: VehicleEnergyType
  status?: VehicleStatus
  createdFrom?: string
  createdTo?: string
  updatedFrom?: string
  updatedTo?: string
  page?: number
  pageSize?: number
  sortField?: VehicleSortField
  sortOrder?: 'asc' | 'desc'
}

export interface VehiclePageResult {
  list: VehicleItem[]
  total: number
  page: number
  pageSize: number
}

export interface CreateVehiclePayload {
  plateNumber: string
  vehicleType: VehicleType
  driveType: VehicleDriveType
  energyType: VehicleEnergyType
  brandModel: string
  vin: string
  axleCount: number | null
  loadCapacity: number | null
  status: VehicleStatus
  remark: string
}

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>

export interface VehicleQueryForm {
  plateNumber: string
  vehicleType: '' | VehicleType
  driveType: '' | VehicleDriveType
  energyType: '' | VehicleEnergyType
  status: '' | VehicleStatus
  createdAtRange: string[]
  updatedAtRange: string[]
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
  flags: {
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
  metrics: {
    loadCapacity: number | null
    daysSinceUpdate: number | null
  }
}

export interface VehicleAiAssistRequest {
  vehicle: VehicleAiAssistDto
  forceRefresh?: boolean
}

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
  | 'AI_RATE_LIMITED'
  | 'AI_TIMEOUT'
  | 'AI_NETWORK_ERROR'
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'AI_PROVIDER_ERROR'
  | 'AI_EMPTY_OUTPUT'
  | 'AI_INVALID_OUTPUT'
  | 'AI_SAVE_FAILED'
  | 'AI_MANUAL_REFRESH_DISABLED'

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

export type VehicleAiFeedbackType = 'helpful' | 'inaccurate' | 'retry'

export interface VehicleAiFeedbackPayload {
  vehicleId: number
  feedbackType: VehicleAiFeedbackType
  comment?: string
}
