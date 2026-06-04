export function validateTruckAssistDto(dto) {
  if (!dto || typeof dto !== 'object') {
    return {
      valid: false,
      message: '请求体不能为空。',
    }
  }

  if (typeof dto.id !== 'number' || typeof dto.truckType !== 'string') {
    return {
      valid: false,
      message: '车辆 AI 分析 DTO 缺少必要字段 id 或 truckType。',
    }
  }

  if (!dto.flags || !dto.metrics) {
    return {
      valid: false,
      message: '车辆 AI 分析 DTO 缺少 flags 或 metrics 字段。',
    }
  }

  return {
    valid: true,
    message: '',
  }
}
