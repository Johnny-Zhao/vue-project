import { requestApi } from '@/api/request'
import type { AuditLogListQuery, AuditLogPageResult } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

// 获取分页操作日志列表。
export function fetchAuditLogsApi(params?: AuditLogListQuery) {
  return requestApi<AuditLogPageResult>({
    url: '/audit-logs',
    method: 'GET',
    params,
    baseURL: API_BASE_URL,
  })
}
