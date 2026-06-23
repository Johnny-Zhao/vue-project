import { Router } from 'express'
import { postTruckAssist, postVehicleAssist } from '../controllers/ai.controller.ts'
import { authorize, requireAuth } from '../middleware/auth.ts'

export const aiRouter = Router()

aiRouter.post('/vehicle-assist', requireAuth, postVehicleAssist)

aiRouter.post(
  '/truck-assist',
  requireAuth,
  authorize({ roles: ['admin'], permissions: ['truck:view'] }),
  postTruckAssist,
)
