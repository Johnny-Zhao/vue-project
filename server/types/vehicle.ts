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
export type VehicleSortOrder = 'asc' | 'desc'

export interface VehicleEntity {
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

export interface VehicleRow {
  id: number | string
  plateNumber: string
  vehicleType: VehicleType
  driveType: VehicleDriveType
  energyType: VehicleEnergyType
  brandModel: string
  vin: string
  axleCount: number | string | null
  loadCapacity: number | string | null
  status: VehicleStatus
  remark: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface VehicleQuery {
  plateNumber?: string
  vehicleType?: VehicleType
  driveType?: VehicleDriveType
  energyType?: VehicleEnergyType
  status?: VehicleStatus
  createdFrom?: string
  createdTo?: string
  updatedFrom?: string
  updatedTo?: string
  page?: number | string
  pageSize?: number | string
  sortField?: VehicleSortField
  sortOrder?: VehicleSortOrder
}

export interface VehicleFilters {
  plateNumber: string
  vehicleType?: VehicleType
  driveType?: VehicleDriveType
  energyType?: VehicleEnergyType
  status?: VehicleStatus
  createdFrom?: string
  createdTo?: string
  updatedFrom?: string
  updatedTo?: string
  page: number
  pageSize: number
  sortField?: VehicleSortField
  sortOrder?: VehicleSortOrder
}

export interface VehicleListQuery {
  whereClause: string
  orderByClause: string
  values: unknown[]
}

export interface VehiclePageResult {
  list: VehicleEntity[]
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
  axleCount?: number | null
  loadCapacity?: number | null
  status: VehicleStatus
  remark?: string
}

export interface UpdateVehiclePayload {
  plateNumber?: string
  vehicleType?: VehicleType
  driveType?: VehicleDriveType
  energyType?: VehicleEnergyType
  brandModel?: string
  vin?: string
  axleCount?: number | null
  loadCapacity?: number | null
  status?: VehicleStatus
  remark?: string
}
