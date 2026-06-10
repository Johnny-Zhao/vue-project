export interface ApiSuccessResponse<T> {
  code: number
  message: string
  data: T
  succeed: true
}

export interface ApiFailureResponse {
  code: number
  message: string
  data: null
  succeed: false
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailureResponse

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

export type RequestParamValue = string | number | boolean | null | undefined

export type RequestParams = Record<string, RequestParamValue>

export interface RequestConfig<
  Body = unknown,
  Params extends object | undefined = object | undefined,
> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  params?: Params
  data?: Body
  headers?: Record<string, string>
  signal?: AbortSignal
  baseURL?: string
  auth?: boolean
  dedupeKey?: string
  suppressGlobalErrorMessage?: boolean
}

export interface MockRequestOptions {
  auth?: boolean
  delay?: number
  signal?: AbortSignal
  dedupeKey?: string
  suppressGlobalErrorMessage?: boolean
}
