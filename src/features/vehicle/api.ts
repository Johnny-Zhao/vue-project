import { requestApi } from '@/api/request'
import type {
  AiAssistResult,
  CreateVehiclePayload,
  VehicleAiFeedbackPayload,
  UpdateVehiclePayload,
  VehicleAiAssistRequest,
  VehicleItem,
  VehicleListQuery,
  VehiclePageResult,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

// 获取分页车辆列表。
export function fetchVehiclesApi(params?: VehicleListQuery) {
  return requestApi<VehiclePageResult>({
    url: '/vehicles',
    method: 'GET',
    params,
    baseURL: API_BASE_URL,
  })
}

// 获取车辆详情。
export function fetchVehicleDetailApi(id: number) {
  return requestApi<VehicleItem>({
    url: `/vehicles/${id}`,
    method: 'GET',
    baseURL: API_BASE_URL,
  })
}

// 新增车辆。
export function createVehicleApi(payload: CreateVehiclePayload) {
  return requestApi<VehicleItem, CreateVehiclePayload>({
    url: '/vehicles',
    method: 'POST',
    data: payload,
    baseURL: API_BASE_URL,
  })
}

// 更新车辆。
export function updateVehicleApi(id: number, payload: UpdateVehiclePayload) {
  return requestApi<VehicleItem, UpdateVehiclePayload>({
    url: `/vehicles/${id}`,
    method: 'PUT',
    data: payload,
    baseURL: API_BASE_URL,
  })
}

// 删除车辆。
export function deleteVehicleApi(id: number) {
  return requestApi<{ id: number; deleted: boolean }>({
    url: `/vehicles/${id}`,
    method: 'DELETE',
    baseURL: API_BASE_URL,
  })
}

// 生成车辆档案 AI 摘要与异常提示。
export function generateVehicleAssistApi(payload: VehicleAiAssistRequest) {
  return requestApi<AiAssistResult, VehicleAiAssistRequest>({
    url: '/ai/vehicle-assist',
    method: 'POST',
    data: payload,
    baseURL: API_BASE_URL,
    suppressGlobalErrorMessage: true,
  })
}

// 提交车辆 AI 结果反馈。
export function submitVehicleAiFeedbackApi(payload: VehicleAiFeedbackPayload) {
  return requestApi<
    { id: number; vehicleId: number; feedbackType: string },
    VehicleAiFeedbackPayload
  >({
    url: '/ai/vehicle-feedback',
    method: 'POST',
    data: payload,
    baseURL: API_BASE_URL,
  })
}
