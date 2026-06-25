import { Router } from 'express'
import { postVehicleAiFeedback, postVehicleAssist } from './ai.controller.ts'
import { requireAuth } from '../../middleware/auth.ts'
import { requireJsonContent } from '../../middleware/requireJsonContent.ts'

export const aiRouter = Router()

aiRouter.post('/vehicle-assist', requireAuth, postVehicleAssist)
aiRouter.post('/vehicle-feedback', requireAuth, requireJsonContent, postVehicleAiFeedback)
