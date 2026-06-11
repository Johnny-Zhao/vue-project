import { Router } from 'express'
import { pgTutorialRouter } from './tutorial.routes.ts'

export const pgApiRouter = Router()

pgApiRouter.use('/tutorial', pgTutorialRouter)
