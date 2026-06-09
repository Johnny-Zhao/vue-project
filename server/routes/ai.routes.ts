import { Router } from 'express'
import { postTruckAssist } from '../controllers/ai.controller.ts'

export const aiRouter = Router()

aiRouter.post('/truck-assist', postTruckAssist)
