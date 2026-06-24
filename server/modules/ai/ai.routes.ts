import { Router } from 'express'
import { postVehicleAssist } from './ai.controller.ts'
import { requireAuth } from '../../middleware/auth.ts'

export const aiRouter = Router()

aiRouter.post('/vehicle-assist', requireAuth, postVehicleAssist)
