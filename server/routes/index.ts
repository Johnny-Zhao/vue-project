import { Router } from 'express'
import { pgApiRouter } from '../pg/routes/index.ts'
import { aiRouter } from './ai.routes.ts'
import { demoRouter } from './demo.routes.ts'
import { healthRouter } from './health.routes.ts'
import { tutorialRouter } from './tutorial.routes.ts'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/demo', demoRouter)
apiRouter.use('/tutorial', tutorialRouter)
apiRouter.use('/pg', pgApiRouter)
apiRouter.use('/ai', aiRouter)
