import { Router } from 'express'
import { postTruckAssist } from '../controllers/ai.controller.js'

export const aiRouter = Router()

aiRouter.post('/truck-assist', postTruckAssist)
