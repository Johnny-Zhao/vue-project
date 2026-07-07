import axios, { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import type {
  ApiFailureResponse,
  ApiResponse,
  ApiSuccessResponse,
  BackendResponse,
  MockRequestOptions,
  RequestParamValue,
  RequestConfig,
} from '@/types/request'
import { getAccessToken } from '@/features/auth/session'

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

type UnauthorizedHandler = () => void

const pendingRequests = new Map<string, AbortController>()

let unauthorizedHandler: UnauthorizedHandler | null = null

export class RequestError extends Error {
  statusCode?: number
  errorCode?: string | number
  isAuthError: boolean

  constructor(
    message: string,
    options: {
      statusCode?: number
      errorCode?: string | number
      isAuthError?: boolean
    } = {},
  ) {
    super(message)
    this.name = 'RequestError'
    this.statusCode = options.statusCode
    this.errorCode = options.errorCode
    this.isAuthError = Boolean(options.isAuthError)
  }
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

const httpClient = axios.create({
  timeout: 15000,
})

type SerializableParams = Record<string, RequestParamValue | RequestParamValue[]>

function normalizeRequestParams(params?: object) {
  if (!params) {
    return undefined
  }

  const normalized: SerializableParams = {}

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    if (Array.isArray(value)) {
      const filtered = value.filter(
        (item): item is Exclude<RequestParamValue, null | undefined> =>
          item !== undefined && item !== null && item !== '',
      )

      if (filtered.length > 0) {
        normalized[key] = filtered
      }

      return
    }

    normalized[key] = String(value)
  })

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

function stringifyParams(params: SerializableParams = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        searchParams.append(key, String(item))
      })
    } else {
      searchParams.append(key, String(value))
    }
  })

  return searchParams.toString()
}

function createHeaders(configHeaders?: Record<string, string>, auth = true) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...configHeaders,
  }

  if (auth) {
    const token = getAccessToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

function stableSerialize(value: unknown): string {
  if (value === undefined) {
    return 'undefined'
  }

  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    )

    return `{${entries.map(([key, item]) => `${key}:${stableSerialize(item)}`).join(',')}}`
  }

  return String(value)
}

function createDedupeKey<Body, Params extends object | undefined>(
  config: RequestConfig<Body, Params>,
) {
  if (config.dedupeKey) {
    return config.dedupeKey
  }

  const normalizedParams = normalizeRequestParams(config.params)
  const paramsKey = normalizedParams ? stableSerialize(normalizedParams) : ''
  const dataKey = config.data !== undefined ? stableSerialize(config.data) : ''

  return `${config.method ?? 'GET'}::${config.baseURL ?? DEFAULT_BASE_URL}::${config.url}::${paramsKey}::${dataKey}`
}

function linkAbortSignals(signal?: AbortSignal, dedupeController?: AbortController) {
  if (!signal || !dedupeController) {
    return
  }

  if (signal.aborted) {
    dedupeController.abort()
    return
  }

  signal.addEventListener('abort', () => dedupeController.abort(), { once: true })
}

function resolveMessageByStatus(status: number) {
  if (status >= 500) {
    return 'Server error. Please try again later.'
  }

  if (status === 403) {
    return 'You do not have permission to access this resource.'
  }

  if (status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  return `Request failed with status ${status}.`
}

function isApiFailureResponse(value: unknown): value is ApiFailureResponse {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    'succeed' in (value as Record<string, unknown>) &&
    (value as Record<string, unknown>).succeed === false &&
    typeof (value as Record<string, unknown>).message === 'string'
  )
}

function isBackendFailureResponse(value: unknown): value is BackendResponse<unknown> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    'succeed' in (value as Record<string, unknown>) &&
    (value as Record<string, unknown>).succeed === false &&
    typeof (value as Record<string, unknown>).msg === 'string'
  )
}

function resolveMessageFromErrorResponse(data: unknown, status: number) {
  if (isApiFailureResponse(data) && data.message.trim()) {
    return data.message
  }

  if (isBackendFailureResponse(data) && data.msg.trim()) {
    return data.msg
  }

  return resolveMessageByStatus(status)
}

function resolveErrorCodeFromErrorResponse(data: unknown) {
  if (isApiFailureResponse(data) && data.errorCode) {
    return data.errorCode
  }

  return undefined
}

function notifyGlobalError(message: string, suppressGlobalErrorMessage = false) {
  if (suppressGlobalErrorMessage) {
    return
  }

  ElMessage.error(message)
}

function createAbortController(config: RequestConfig<unknown, object | undefined>) {
  const dedupeKey = createDedupeKey(config)
  const previousController = pendingRequests.get(dedupeKey)
  previousController?.abort()

  const controller = new AbortController()
  pendingRequests.set(dedupeKey, controller)

  return { dedupeKey, controller }
}

function clearPendingRequest(dedupeKey: string, controller: AbortController) {
  if (pendingRequests.get(dedupeKey) === controller) {
    pendingRequests.delete(dedupeKey)
  }
}

function handleUnauthorized() {
  unauthorizedHandler?.()
}

function throwStatusError(
  status: number,
  responseData?: unknown,
  suppressGlobalErrorMessage = false,
): never {
  const message = resolveMessageFromErrorResponse(responseData, status)
  const errorCode = resolveErrorCodeFromErrorResponse(responseData)

  if (status === 401) {
    handleUnauthorized()
  }

  notifyGlobalError(message, suppressGlobalErrorMessage)

  throw new RequestError(message, {
    statusCode: status,
    errorCode,
    isAuthError: status === 401,
  })
}

function unwrapApiResponse<T>(
  response: ApiResponse<T>,
  options: {
    auth?: boolean
    suppressGlobalErrorMessage?: boolean
  } = {},
) {
  if (response.succeed) {
    return response.data
  }

  if (response.code === 401 && options.auth !== false) {
    handleUnauthorized()
  }

  notifyGlobalError(response.message, options.suppressGlobalErrorMessage)

  throw new RequestError(response.message || 'Request failed', {
    statusCode: response.code,
    errorCode: response.errorCode ?? response.code,
    isAuthError: response.code === 401 && options.auth !== false,
  })
}

export async function request<
  ResponseData,
  RequestData = unknown,
  Params extends object | undefined = object | undefined,
>(config: RequestConfig<RequestData, Params>): Promise<ResponseData> {
  const {
    url,
    method = 'GET',
    params,
    data,
    signal,
    baseURL = DEFAULT_BASE_URL,
    auth = true,
    timeout,
    suppressGlobalErrorMessage = false,
  } = config

  const normalizedParams = normalizeRequestParams(params)
  const { dedupeKey, controller } = createAbortController(config)
  linkAbortSignals(signal, controller)

  try {
    const response = await httpClient.request<ResponseData>({
      url: `${baseURL}${url}`,
      method,
      params: normalizedParams,
      paramsSerializer: normalizedParams
        ? {
            serialize: stringifyParams,
          }
        : undefined,
      data,
      headers: createHeaders(config.headers, auth),
      signal: controller.signal,
      timeout,
    })

    return response.data
  } catch (error) {
    if (error instanceof RequestError) {
      throw error
    }

    if (axios.isCancel(error)) {
      throw new RequestError('Request canceled.')
    }

    if (error instanceof AxiosError) {
      if (error.response?.status) {
        throwStatusError(error.response.status, error.response.data, suppressGlobalErrorMessage)
      }

      const fallbackMessage = 'Network request failed. Please try again.'
      notifyGlobalError(fallbackMessage, suppressGlobalErrorMessage)
      throw new RequestError(fallbackMessage)
    }

    const fallbackMessage = 'Unexpected request error. Please try again.'
    notifyGlobalError(fallbackMessage, suppressGlobalErrorMessage)
    throw new RequestError(fallbackMessage)
  } finally {
    clearPendingRequest(dedupeKey, controller)
  }
}

export function createApiSuccessResponse<T>(
  data: T,
  message = 'success',
  code = 200,
): ApiSuccessResponse<T> {
  return {
    code,
    message,
    data,
    succeed: true,
  }
}

export function createApiFailureResponse(code: number, message: string): ApiFailureResponse {
  return {
    code,
    message,
    data: null,
    succeed: false,
  }
}

export async function requestApi<
  ResponseData,
  RequestData = unknown,
  Params extends object | undefined = object | undefined,
>(config: RequestConfig<RequestData, Params>): Promise<ResponseData> {
  const response = await request<ApiResponse<ResponseData>, RequestData, Params>(config)
  return unwrapApiResponse(response, {
    auth: config.auth,
    suppressGlobalErrorMessage: config.suppressGlobalErrorMessage,
  })
}

export async function requestData<
  ResponseData,
  RequestData = unknown,
  Params extends object | undefined = object | undefined,
>(config: RequestConfig<RequestData, Params>): Promise<ResponseData> {
  const response = await request<BackendResponse<ResponseData>, RequestData, Params>(config)

  if (!response.succeed || response.code !== 200) {
    if (response.code === 401 && config.auth !== false) {
      handleUnauthorized()
    }

    const message = response.msg || 'Request failed'
    notifyGlobalError(message, config.suppressGlobalErrorMessage)

    throw new RequestError(message, {
      statusCode: response.code,
      errorCode: response.code,
      isAuthError: response.code === 401 && config.auth !== false,
    })
  }

  return response.data
}

export async function mockApiRequest<T>(
  resolver: () => ApiResponse<T>,
  options: MockRequestOptions = {},
) {
  const {
    auth = true,
    delay = 250,
    signal,
    dedupeKey,
    suppressGlobalErrorMessage = false,
  } = options

  const config: RequestConfig = {
    url: `mock://${dedupeKey ?? Math.random().toString(36).slice(2)}`,
    method: 'POST',
    signal,
    auth,
    dedupeKey,
    suppressGlobalErrorMessage,
  }

  const { dedupeKey: resolvedDedupeKey, controller } = createAbortController(config)
  linkAbortSignals(signal, controller)

  try {
    const response = await new Promise<ApiResponse<T>>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        if (auth && !getAccessToken()) {
          resolve(createApiFailureResponse(401, 'Your session has expired. Please sign in again.'))
          return
        }

        resolve(resolver())
      }, delay)

      controller.signal.addEventListener(
        'abort',
        () => {
          window.clearTimeout(timer)
          reject(new AxiosError('Request canceled.', AxiosError.ERR_CANCELED))
        },
        { once: true },
      )
    })

    return unwrapApiResponse(response, {
      auth,
      suppressGlobalErrorMessage,
    })
  } catch (error) {
    if (axios.isCancel(error)) {
      throw new RequestError('Request canceled.')
    }

    if (error instanceof RequestError) {
      throw error
    }

    const fallbackMessage = 'Mock request failed.'
    notifyGlobalError(fallbackMessage, suppressGlobalErrorMessage)
    throw new RequestError(fallbackMessage)
  } finally {
    clearPendingRequest(resolvedDedupeKey, controller)
  }
}
