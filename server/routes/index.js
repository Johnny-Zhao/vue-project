import { Router } from 'express'
import { aiRouter } from './ai.routes.js'
import { demoRouter } from './demo.routes.js'
import { healthRouter } from './health.routes.js'
import { tutorialRouter } from './tutorial.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/demo', demoRouter)
apiRouter.use('/tutorial', tutorialRouter)
apiRouter.use('/ai', aiRouter)
