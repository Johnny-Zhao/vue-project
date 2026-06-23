import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  VehicleDriveType,
  VehicleEnergyType,
  VehiclePageResult,
  VehicleQuery,
  VehicleSortField,
  VehicleSortOrder,
  VehicleStatus,
  VehicleType,
} from '../types/vehicle.ts'
import {
  createVehicle as createVehicleRecord,
  deleteVehicle as deleteVehicleRecord,
  findVehicleById,
  findVehicleByPlateNumber,
  listVehicles as listVehicleRecords,
  updateVehicle as updateVehicleRecord,
} from '../pg/repositories/vehicle.repository.ts'
import { createAuditLog } from '../pg/repositories/auditLog.repository.ts'
import { AppError } from '../utils/appError.ts'

interface OperationContext {
  operatorId: number
  operatorName: string
  requestId: string
}

const allowedVehicleTypes: VehicleType[] = ['tractor', 'truck', 'trailer', 'van']
const allowedDriveTypes: VehicleDriveType[] = ['4x2', '6x4', '8x4']
const allowedEnergyTypes: VehicleEnergyType[] = ['diesel', 'lng', 'electric', 'hybrid']
const allowedStatuses: VehicleStatus[] = ['active', 'inactive', 'maintenance']
const allowedSortFields: VehicleSortField[] = [
  'id',
  'plateNumber',
  'vehicleType',
  'driveType',
  'energyType',
  'status',
  'createdAt',
  'updatedAt',
]

// Normalize free text filter values.
function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

// Parse a positive integer with fallback for paging inputs.
function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

// Parse and validate a vehicle id.
function parseVehicleId(rawId: unknown) {
  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Vehicle id must be a positive integer.', 400)
  }

  return id
}

// Parse enum filters and ignore unknown values.
function parseEnum<T extends string>(value: unknown, allowedValues: T[]) {
  if (typeof value !== 'string') {
    return undefined
  }

  return allowedValues.includes(value as T) ? (value as T) : undefined
}

// Parse sort field safely before it reaches SQL.
function parseSortField(value: unknown): VehicleSortField | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  return allowedSortFields.includes(value as VehicleSortField)
    ? (value as VehicleSortField)
    : undefined
}

// Parse sort direction.
function parseSortOrder(value: unknown): VehicleSortOrder | undefined {
  return value === 'asc' || value === 'desc' ? value : undefined
}

// Parse a date string for range filters.
function parseDateTime(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

// Enforce unique plate numbers across the table.
async function ensureUniquePlateNumber(plateNumber: string, currentVehicleId?: number) {
  const existingVehicle = await findVehicleByPlateNumber(plateNumber)

  if (existingVehicle && existingVehicle.id !== currentVehicleId) {
    throw new AppError('车牌号已存在。', 409)
  }
}

// Return a paginated vehicle list.
export async function listVehicles(filters: VehicleQuery = {}): Promise<VehiclePageResult> {
  const plateNumber = normalizeText(filters.plateNumber, 20).toUpperCase()
  const vehicleType = parseEnum(filters.vehicleType, allowedVehicleTypes)
  const driveType = parseEnum(filters.driveType, allowedDriveTypes)
  const energyType = parseEnum(filters.energyType, allowedEnergyTypes)
  const status = parseEnum(filters.status, allowedStatuses)
  const page = parsePositiveInt(filters.page, 1)
  const pageSize = Math.min(parsePositiveInt(filters.pageSize, 10), 50)
  const sortField = parseSortField(filters.sortField)
  const sortOrder = parseSortOrder(filters.sortOrder)
  const createdFrom = parseDateTime(filters.createdFrom)
  const createdTo = parseDateTime(filters.createdTo)
  const updatedFrom = parseDateTime(filters.updatedFrom)
  const updatedTo = parseDateTime(filters.updatedTo)

  const result = await listVehicleRecords({
    plateNumber,
    vehicleType,
    driveType,
    energyType,
    status,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    page,
    pageSize,
    sortField,
    sortOrder,
  })

  return {
    list: result.list,
    total: result.total,
    page,
    pageSize,
  }
}

// Return one vehicle detail record.
export async function getVehicleDetail(rawId: unknown) {
  const id = parseVehicleId(rawId)
  const vehicle = await findVehicleById(id)

  if (!vehicle) {
    throw new AppError(`Vehicle ${id} was not found.`, 404)
  }

  return vehicle
}

// Create a vehicle and persist an audit log record.
export async function createVehicle(payload: CreateVehiclePayload, context: OperationContext) {
  await ensureUniquePlateNumber(payload.plateNumber)

  const vehicle = await createVehicleRecord({
    ...payload,
    createdById: context.operatorId,
    createdByName: context.operatorName,
  })

  if (!vehicle) {
    throw new AppError('Failed to create vehicle.', 500)
  }

  await createAuditLog({
    module: 'vehicle',
    action: 'create',
    entityId: vehicle.id,
    entityName: vehicle.plateNumber,
    afterData: vehicle,
    operatorId: context.operatorId,
    operatorName: context.operatorName,
    requestId: context.requestId,
  })

  return vehicle
}

// Update a vehicle and persist before and after snapshots.
export async function updateVehicle(
  rawId: unknown,
  payload: UpdateVehiclePayload,
  context: OperationContext,
) {
  const id = parseVehicleId(rawId)
  const currentVehicle = await findVehicleById(id)

  if (!currentVehicle) {
    throw new AppError(`Vehicle ${id} was not found.`, 404)
  }

  if (payload.plateNumber) {
    await ensureUniquePlateNumber(payload.plateNumber, id)
  }

  const vehicle = await updateVehicleRecord(id, {
    ...payload,
    updatedById: context.operatorId,
    updatedByName: context.operatorName,
  })

  if (!vehicle) {
    throw new AppError('Failed to update vehicle.', 500)
  }

  await createAuditLog({
    module: 'vehicle',
    action: 'update',
    entityId: vehicle.id,
    entityName: vehicle.plateNumber,
    beforeData: currentVehicle,
    afterData: vehicle,
    operatorId: context.operatorId,
    operatorName: context.operatorName,
    requestId: context.requestId,
  })

  return vehicle
}

// Delete a vehicle and keep the deleted snapshot in audit logs.
export async function removeVehicle(rawId: unknown, context: OperationContext) {
  const id = parseVehicleId(rawId)
  const deletedVehicle = await deleteVehicleRecord(id)

  if (!deletedVehicle) {
    throw new AppError(`Vehicle ${id} was not found.`, 404)
  }

  await createAuditLog({
    module: 'vehicle',
    action: 'delete',
    entityId: deletedVehicle.id,
    entityName: deletedVehicle.plateNumber,
    beforeData: deletedVehicle,
    operatorId: context.operatorId,
    operatorName: context.operatorName,
    requestId: context.requestId,
  })

  return {
    id: deletedVehicle.id,
    deleted: true,
  }
}
