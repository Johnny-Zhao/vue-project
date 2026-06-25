import type { ApiFailureResponse, ApiSuccessResponse } from '../types/http.ts'

// 构建统一成功响应结构。
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

// 构建统一失败响应结构，并携带业务错误码。
export function createFailureResponse(
  message: string,
  code = 500,
  errorCode?: string,
): ApiFailureResponse {
  return {
    code,
    message,
    data: null,
    succeed: false,
    errorCode,
  }
}
