import type { BodyValidationResult } from '../types/http.ts'
import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  VehicleDriveType,
  VehicleEnergyType,
  VehicleStatus,
  VehicleType,
} from '../types/vehicle.ts'
import { AppError } from '../utils/appError.ts'

const allowedVehicleTypes: VehicleType[] = ['tractor', 'truck', 'trailer', 'van']
const allowedDriveTypes: VehicleDriveType[] = ['4x2', '6x4', '8x4']
const allowedEnergyTypes: VehicleEnergyType[] = ['diesel', 'lng', 'electric', 'hybrid']
const allowedStatuses: VehicleStatus[] = ['active', 'inactive', 'maintenance']

// Normalize plain text input.
function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

// Normalize fields that should be stored in uppercase form.
function normalizeUpperText(value: unknown, maxLength: number) {
  return normalizeText(value, maxLength).toUpperCase()
}

// Parse an optional non-negative number.
function parseOptionalNumber(value: unknown, fieldLabel: string) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(`${fieldLabel} must be a number greater than or equal to 0.`, 400)
  }

  return parsed
}

// Parse an enum field and reject unknown values.
function parseEnum<T extends string>(value: unknown, allowedValues: T[], fieldLabel: string) {
  if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
    throw new AppError(`${fieldLabel} is invalid.`, 400)
  }

  return value as T
}

// Validate and normalize the vehicle create payload.
export function validateCreateVehiclePayload(
  body: unknown,
): BodyValidationResult<CreateVehiclePayload> {
  try {
    const source = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const plateNumber = normalizeUpperText(source.plateNumber, 20)
    const brandModel = normalizeText(source.brandModel, 60)
    const vin = normalizeUpperText(source.vin, 30)
    const remark = normalizeText(source.remark, 300)

    if (!plateNumber) {
      return { valid: false, error: new AppError('Plate number is required.', 400) }
    }

    if (!brandModel) {
      return { valid: false, error: new AppError('Brand model is required.', 400) }
    }

    return {
      valid: true,
      data: {
        plateNumber,
        vehicleType: parseEnum(source.vehicleType, allowedVehicleTypes, 'vehicleType'),
        driveType: parseEnum(source.driveType, allowedDriveTypes, 'driveType'),
        energyType: parseEnum(source.energyType, allowedEnergyTypes, 'energyType'),
        brandModel,
        vin,
        axleCount: parseOptionalNumber(source.axleCount, 'axleCount') ?? null,
        loadCapacity: parseOptionalNumber(source.loadCapacity, 'loadCapacity') ?? null,
        status: parseEnum(source.status, allowedStatuses, 'status'),
        remark,
      },
    }
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error : new AppError('Vehicle payload validation failed.', 400),
    }
  }
}

// Validate and normalize the vehicle update payload.
export function validateUpdateVehiclePayload(
  body: unknown,
): BodyValidationResult<UpdateVehiclePayload> {
  try {
    const source = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const payload: UpdateVehiclePayload = {}

    if (source.plateNumber !== undefined) {
      const plateNumber = normalizeUpperText(source.plateNumber, 20)

      if (!plateNumber) {
        return { valid: false, error: new AppError('Plate number is required.', 400) }
      }

      payload.plateNumber = plateNumber
    }

    if (source.vehicleType !== undefined) {
      payload.vehicleType = parseEnum(source.vehicleType, allowedVehicleTypes, 'vehicleType')
    }

    if (source.driveType !== undefined) {
      payload.driveType = parseEnum(source.driveType, allowedDriveTypes, 'driveType')
    }

    if (source.energyType !== undefined) {
      payload.energyType = parseEnum(source.energyType, allowedEnergyTypes, 'energyType')
    }

    if (source.brandModel !== undefined) {
      const brandModel = normalizeText(source.brandModel, 60)

      if (!brandModel) {
        return { valid: false, error: new AppError('Brand model is required.', 400) }
      }

      payload.brandModel = brandModel
    }

    if (source.vin !== undefined) {
      payload.vin = normalizeUpperText(source.vin, 30)
    }

    if (source.axleCount !== undefined) {
      payload.axleCount = parseOptionalNumber(source.axleCount, 'axleCount') ?? null
    }

    if (source.loadCapacity !== undefined) {
      payload.loadCapacity = parseOptionalNumber(source.loadCapacity, 'loadCapacity') ?? null
    }

    if (source.status !== undefined) {
      payload.status = parseEnum(source.status, allowedStatuses, 'status')
    }

    if (source.remark !== undefined) {
      payload.remark = normalizeText(source.remark, 300)
    }

    return {
      valid: true,
      data: payload,
    }
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error : new AppError('Vehicle payload validation failed.', 400),
    }
  }
}
