import { requestApi } from '@/api/request'
import type { AiAssistResult, TruckAiAssistDto } from '@/services/ai/types'

const AI_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function generateTruckAssistApi(payload: TruckAiAssistDto) {
  return requestApi<AiAssistResult, TruckAiAssistDto>({
    url: '/ai/truck-assist',
    method: 'POST',
    data: payload,
    baseURL: AI_API_BASE_URL,
    suppressGlobalErrorMessage: true,
  })
}
