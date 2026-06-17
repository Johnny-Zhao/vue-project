import { requestApi } from '@/api/request'
import type {
  DemoTaskItem,
  EchoPayloadResult,
  ExpressOverview,
  ExpressStructureItem,
} from '@/types/serverDemo'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export function fetchExpressOverviewApi() {
  return requestApi<ExpressOverview>({
    url: '/demo/overview',
    method: 'GET',
    baseURL: API_BASE_URL,
  })
}

export function fetchExpressStructureApi() {
  return requestApi<ExpressStructureItem[]>({
    url: '/demo/structure',
    method: 'GET',
    baseURL: API_BASE_URL,
  })
}

export function fetchDemoTasksApi() {
  return requestApi<DemoTaskItem[]>({
    url: '/demo/tasks',
    method: 'GET',
    baseURL: API_BASE_URL,
  })
}

export function fetchDemoTaskDetailApi(id: number) {
  return requestApi<DemoTaskItem>({
    url: `/demo/tasks/${id}`,
    method: 'GET',
    baseURL: API_BASE_URL,
  })
}

export function postEchoPayloadApi(payload: Record<string, unknown>) {
  return requestApi<EchoPayloadResult, Record<string, unknown>>({
    url: '/demo/echo',
    method: 'POST',
    data: payload,
    baseURL: API_BASE_URL,
  })
}
