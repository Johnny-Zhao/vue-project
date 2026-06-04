export type AiConfidence = 'low' | 'medium' | 'high'

export interface AiAssistResult {
  summary: string[]
  risks: string[]
  nextActions: string[]
  confidence: AiConfidence
  source: 'api' | 'mock' | 'fallback'
  cached: boolean
  generatedAt: string
  notice?: string
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
  flags: {
    missingTractorPlate: boolean
    missingTrailerPlate: boolean
    missingModel: boolean
    highUnknownFieldRatio: boolean
    missingUpdateOwner: boolean
    staleRecord: boolean
    whiteListMissingCode: boolean
    fuelConsumptionMissing: boolean
  }
  metrics: {
    consumption: number | null
    daysSinceUpdate: number | null
  }
}
