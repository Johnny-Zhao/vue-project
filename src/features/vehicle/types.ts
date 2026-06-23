export type VehicleType = 'tractor' | 'truck' | 'trailer' | 'van'
export type VehicleDriveType = '4x2' | '6x4' | '8x4'
export type VehicleEnergyType = 'diesel' | 'lng' | 'electric' | 'hybrid'
export type VehicleStatus = 'active' | 'inactive' | 'maintenance'
export type VehicleSortField =
  | 'id'
  | 'plateNumber'
  | 'vehicleType'
  | 'driveType'
  | 'energyType'
  | 'status'
  | 'createdAt'
  | 'updatedAt'

export interface VehicleItem {
  id: number
  plateNumber: string
  vehicleType: VehicleType
  driveType: VehicleDriveType
  energyType: VehicleEnergyType
  brandModel: string
  vin: string
  axleCount: number | null
  loadCapacity: number | null
  status: VehicleStatus
  remark: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface VehicleListQuery {
  plateNumber?: string
  vehicleType?: VehicleType
  driveType?: VehicleDriveType
  energyType?: VehicleEnergyType
  status?: VehicleStatus
  createdFrom?: string
  createdTo?: string
  updatedFrom?: string
  updatedTo?: string
  page?: number
  pageSize?: number
  sortField?: VehicleSortField
  sortOrder?: 'asc' | 'desc'
}

export interface VehiclePageResult {
  list: VehicleItem[]
  total: number
  page: number
  pageSize: number
}

export interface CreateVehiclePayload {
  plateNumber: string
  vehicleType: VehicleType
  driveType: VehicleDriveType
  energyType: VehicleEnergyType
  brandModel: string
  vin: string
  axleCount: number | null
  loadCapacity: number | null
  status: VehicleStatus
  remark: string
}

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>

export interface VehicleQueryForm {
  plateNumber: string
  vehicleType: '' | VehicleType
  driveType: '' | VehicleDriveType
  energyType: '' | VehicleEnergyType
  status: '' | VehicleStatus
  createdAtRange: string[]
  updatedAtRange: string[]
}
