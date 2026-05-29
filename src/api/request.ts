import type { ApiResponse, BackendResponse, RequestConfig } from '@/types/request'

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

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

// Raw network request.
// This only handles fetch, query-string building, and HTTP-level errors.
export async function request<ResponseData, RequestData = unknown>(
  config: RequestConfig<RequestData>,
): Promise<ResponseData> {
  const {
    url,
    method = 'GET',
    params,
    data,
    headers,
    signal,
    baseURL = DEFAULT_BASE_URL,
  } = config

  const response = await fetch(`${baseURL}${url}${buildQueryString(params)}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    signal,
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as ResponseData
}

// Business-level request wrapper for backends that always return:
// { code, msg, count, data, succeed }
export async function requestData<ResponseData, RequestData = unknown>(
  config: RequestConfig<RequestData>,
): Promise<ResponseData> {
  const response = await request<BackendResponse<ResponseData>, RequestData>(config)

  if (!response.succeed || response.code !== 200) {
    throw new Error(response.msg || 'Request failed')
  }

  return response.data
}

export function mockRequest<T>(
  data: T,
  options: { code?: number; message?: string; delay?: number } = {},
): Promise<ApiResponse<T>> {
  const { code = 0, message = 'success', delay = 250 } = options

  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve({
        code,
        message,
        data,
      })
    }, delay)
  })
}
