import { requestApi } from '@/api/request'
import type { AiRuntimeConfigItem, UpdateAiRuntimeConfigPayload } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

// 获取当前 AI 运行配置。
export function fetchAiRuntimeConfigApi() {
  return requestApi<AiRuntimeConfigItem>({
    url: '/ai-config',
    method: 'GET',
    baseURL: API_BASE_URL,
  })
}

// 更新当前 AI 运行配置。
export function updateAiRuntimeConfigApi(payload: UpdateAiRuntimeConfigPayload) {
  return requestApi<AiRuntimeConfigItem, UpdateAiRuntimeConfigPayload>({
    url: '/ai-config',
    method: 'PUT',
    data: payload,
    baseURL: API_BASE_URL,
  })
}
