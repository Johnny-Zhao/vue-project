import { Router } from 'express'
import {
  deleteVehicle,
  getVehicleById,
  getVehicles,
  postVehicle,
  putVehicle,
} from '../controllers/vehicle.controller.ts'
import { requireAuth } from '../middleware/auth.ts'
import { requireJsonContent } from '../middleware/requireJsonContent.ts'
import { validateBody } from '../middleware/validateBody.ts'
import { asyncHandler } from '../utils/asyncHandler.ts'
import {
  validateCreateVehiclePayload,
  validateUpdateVehiclePayload,
} from '../validators/vehicle.validator.ts'

export const vehicleRouter = Router()

vehicleRouter.use(requireAuth)

vehicleRouter.get('/', asyncHandler(getVehicles))
vehicleRouter.get('/:id', asyncHandler(getVehicleById))
vehicleRouter.post(
  '/',
  requireJsonContent,
  validateBody(validateCreateVehiclePayload),
  asyncHandler(postVehicle),
)
vehicleRouter.put(
  '/:id',
  requireJsonContent,
  validateBody(validateUpdateVehiclePayload),
  asyncHandler(putVehicle),
)
vehicleRouter.delete('/:id', asyncHandler(deleteVehicle))
