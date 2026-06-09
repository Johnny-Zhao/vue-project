import type { ApiFailureResponse, ApiSuccessResponse } from '../types/http.ts'

export function createSuccessResponse<T>(
  data: T,
  message = '请求成功',
  code = 200,
): ApiSuccessResponse<T> {
  return {
    code,
    message,
    data,
    succeed: true,
  }
}

export function createFailureResponse(message: string, code = 500): ApiFailureResponse {
  return {
    code,
    message,
    data: null,
    succeed: false,
  }
}
