import axios, { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import type {
  ApiFailureResponse,
  ApiResponse,
  ApiSuccessResponse,
  BackendResponse,
  MockRequestOptions,
  RequestConfig,
} from '@/types/request'
import { getAccessToken } from '@/features/auth/session'

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

type UnauthorizedHandler = () => void

const pendingRequests = new Map<string, AbortController>()

let unauthorizedHandler: UnauthorizedHandler | null = null

export class RequestError extends Error {
  statusCode?: number
  errorCode?: number
  isAuthError: boolean

  constructor(
    message: string,
    options: {
      statusCode?: number
      errorCode?: number
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

function buildQueryString(params: RequestConfig['params'] = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.append(key, String(value))
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

function createHeaders(configHeaders?: Record<string, string>, auth = true) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(configHeaders ?? {}),
  }

  if (auth) {
    const token = getAccessToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

function createDedupeKey<Body>(config: RequestConfig<Body>) {
  if (config.dedupeKey) {
    return config.dedupeKey
  }

  return `${config.method ?? 'GET'}::${config.baseURL ?? DEFAULT_BASE_URL}::${config.url}`
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

function notifyGlobalError(message: string, suppressGlobalErrorMessage = false) {
  if (suppressGlobalErrorMessage) {
    return
  }

  ElMessage.error(message)
}

function createAbortController(config: RequestConfig<unknown>) {
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

function throwStatusError(status: number, suppressGlobalErrorMessage = false): never {
  const message = resolveMessageByStatus(status)

  if (status === 401) {
    handleUnauthorized()
  }

  notifyGlobalError(message, suppressGlobalErrorMessage)

  throw new RequestError(message, {
    statusCode: status,
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
    errorCode: response.code,
    isAuthError: response.code === 401 && options.auth !== false,
  })
}

export async function request<ResponseData, RequestData = unknown>(
  config: RequestConfig<RequestData>,
): Promise<ResponseData> {
  const {
    url,
    method = 'GET',
    params,
    data,
    signal,
    baseURL = DEFAULT_BASE_URL,
    auth = true,
    suppressGlobalErrorMessage = false,
  } = config

  const { dedupeKey, controller } = createAbortController(config)
  linkAbortSignals(signal, controller)

  try {
    const response = await httpClient.request<ResponseData>({
      url: `${baseURL}${url}${buildQueryString(params)}`,
      method,
      data,
      headers: createHeaders(config.headers, auth),
      signal: controller.signal,
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
        throwStatusError(error.response.status, suppressGlobalErrorMessage)
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

export async function requestApi<ResponseData, RequestData = unknown>(
  config: RequestConfig<RequestData>,
): Promise<ResponseData> {
  const response = await request<ApiResponse<ResponseData>, RequestData>(config)
  return unwrapApiResponse(response, {
    auth: config.auth,
    suppressGlobalErrorMessage: config.suppressGlobalErrorMessage,
  })
}

export async function requestData<ResponseData, RequestData = unknown>(
  config: RequestConfig<RequestData>,
): Promise<ResponseData> {
  const response = await request<BackendResponse<ResponseData>, RequestData>(config)

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
