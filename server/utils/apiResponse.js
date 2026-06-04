export function createSuccessResponse(data, message = '请求成功', code = 200) {
  return {
    code,
    message,
    data,
    succeed: true,
  }
}

export function createFailureResponse(message, code = 500) {
  return {
    code,
    message,
    data: null,
    succeed: false,
  }
}
