import type { CreateVehiclePayload, UpdateVehiclePayload } from '../../types/vehicle.ts'
import type { ServerRequestHandler } from '../../types/http.ts'
import {
  createVehicle,
  getVehicleDetail,
  listVehicles,
  removeVehicle,
  updateVehicle,
} from './vehicle.service.ts'
import { createSuccessResponse } from '../../utils/apiResponse.ts'
import { AppError } from '../../utils/appError.ts'

// Read operator data from request context for service and audit logging.
function getOperatorContext(req: Parameters<ServerRequestHandler>[0]) {
  if (!req.authUser || !req.requestId) {
    throw new AppError('The request is missing operator context.', 500)
  }

  return {
    operatorId: req.authUser.id,
    operatorName: req.authUser.name,
    requestId: req.requestId,
  }
}

// Return the vehicle list page result.
export const getVehicles: ServerRequestHandler = async (req, res) => {
  const data = await listVehicles(req.query)
  res.json(createSuccessResponse(data, 'Vehicle list loaded.'))
}

// Return one vehicle detail record.
export const getVehicleById: ServerRequestHandler = async (req, res) => {
  const data = await getVehicleDetail(req.params.id)
  res.json(createSuccessResponse(data, 'Vehicle detail loaded.'))
}

// Create a vehicle record.
export const postVehicle: ServerRequestHandler = async (req, res) => {
  const data = await createVehicle(
    req.validatedBody as CreateVehiclePayload,
    getOperatorContext(req),
  )
  res.status(201).json(createSuccessResponse(data, 'Vehicle created successfully.', 201))
}

// Update a vehicle record.
export const putVehicle: ServerRequestHandler = async (req, res) => {
  const data = await updateVehicle(
    req.params.id,
    req.validatedBody as UpdateVehiclePayload,
    getOperatorContext(req),
  )
  res.json(createSuccessResponse(data, 'Vehicle updated successfully.'))
}

// Delete a vehicle record.
export const deleteVehicle: ServerRequestHandler = async (req, res) => {
  const data = await removeVehicle(req.params.id, getOperatorContext(req))
  res.json(createSuccessResponse(data, 'Vehicle deleted successfully.'))
}
