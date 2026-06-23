import type { FormFieldOption } from '@/components/formSchemas'
import type { VehicleDriveType, VehicleEnergyType, VehicleStatus, VehicleType } from './types'

export const vehicleTypeOptions: FormFieldOption[] = [
  { label: '牵引车', value: 'tractor' },
  { label: '载货车', value: 'truck' },
  { label: '挂车', value: 'trailer' },
  { label: '厢式车', value: 'van' },
]

export const vehicleDriveTypeOptions: FormFieldOption[] = [
  { label: '4x2', value: '4x2' },
  { label: '6x4', value: '6x4' },
  { label: '8x4', value: '8x4' },
]

export const vehicleEnergyTypeOptions: FormFieldOption[] = [
  { label: '柴油', value: 'diesel' },
  { label: 'LNG', value: 'lng' },
  { label: '纯电', value: 'electric' },
  { label: '混动', value: 'hybrid' },
]

export const vehicleStatusOptions: FormFieldOption[] = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '维修中', value: 'maintenance' },
]

const vehicleTypeLabelMap: Record<VehicleType, string> = {
  tractor: '牵引车',
  truck: '载货车',
  trailer: '挂车',
  van: '厢式车',
}

const vehicleDriveTypeLabelMap: Record<VehicleDriveType, string> = {
  '4x2': '4x2',
  '6x4': '6x4',
  '8x4': '8x4',
}

const vehicleEnergyTypeLabelMap: Record<VehicleEnergyType, string> = {
  diesel: '柴油',
  lng: 'LNG',
  electric: '纯电',
  hybrid: '混动',
}

const vehicleStatusLabelMap: Record<VehicleStatus, string> = {
  active: '启用',
  inactive: '停用',
  maintenance: '维修中',
}

// 格式化车辆类型显示文本。
export function formatVehicleType(value: VehicleType) {
  return vehicleTypeLabelMap[value]
}

// 格式化驱动形式显示文本。
export function formatVehicleDriveType(value: VehicleDriveType) {
  return vehicleDriveTypeLabelMap[value]
}

// 格式化能源类型显示文本。
export function formatVehicleEnergyType(value: VehicleEnergyType) {
  return vehicleEnergyTypeLabelMap[value]
}

// 格式化状态显示文本。
export function formatVehicleStatus(value: VehicleStatus) {
  return vehicleStatusLabelMap[value]
}
