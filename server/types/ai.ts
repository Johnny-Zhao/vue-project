export type AiConfidence = 'low' | 'medium' | 'high'
export type AiSource = 'api' | 'mock' | 'fallback'

export interface AiAssistResult {
  summary: string[]
  risks: string[]
  nextActions: string[]
  confidence: AiConfidence
  source: AiSource
  cached: boolean
  generatedAt: string
  notice?: string
}

export interface TruckAssistFlags {
  missingTractorPlate: boolean
  missingTrailerPlate: boolean
  missingModel: boolean
  highUnknownFieldRatio: boolean
  missingUpdateOwner: boolean
  staleRecord: boolean
  whiteListMissingCode: boolean
  fuelConsumptionMissing: boolean
}

export interface TruckAssistMetrics {
  consumption: number | null
  daysSinceUpdate: number | null
}

export interface TruckAiAssistDto {
  id: number
  truckType: string
  tractorLicensePlateNo: string
  trailerLicensePlateNo: string
  truckModel: string
  whiteTruckLabel: string
  powerType: string
  updatedBy: string
  updatedAt: string
  flags: TruckAssistFlags
  metrics: TruckAssistMetrics
}
