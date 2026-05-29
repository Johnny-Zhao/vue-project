export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// Fixed backend envelope used by the real business API.
export interface BackendResponse<T> {
  code: number
  msg: string
  count?: number
  data: T
  succeed: boolean
}

export interface ListResponse<T> {
  list: T[]
  total: number
}

export interface RequestConfig<Body = unknown> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  params?: Record<string, string | number | boolean | null | undefined>
  data?: Body
  headers?: HeadersInit
  signal?: AbortSignal
  baseURL?: string
}
