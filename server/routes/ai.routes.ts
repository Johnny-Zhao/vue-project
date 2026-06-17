import { Router } from 'express'
import { postTruckAssist } from '../controllers/ai.controller.ts'
import { authorize, requireAuth } from '../middleware/auth.ts'

export const aiRouter = Router()

aiRouter.post(
  '/truck-assist',
  requireAuth,
  authorize({ roles: ['admin'], permissions: ['truck:view'] }),
  postTruckAssist,
)
