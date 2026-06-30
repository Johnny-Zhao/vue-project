import { Router } from 'express'
import { pgApiRouter } from '../pg/routes/index.ts'
import { aiRouter } from '../modules/ai/ai.routes.ts'
import { aiConfigRouter } from '../modules/ai-config/aiConfig.routes.ts'
import { auditLogRouter } from '../modules/auditLog/auditLog.routes.ts'
import { authRouter } from '../modules/auth/auth.routes.ts'
import { knowledgeRouter } from '../modules/knowledge/knowledge.routes.ts'
import { demoRouter } from './demo.routes.ts'
import { healthRouter } from './health.routes.ts'
import { tutorialRouter } from './tutorial.routes.ts'
import { userRouter } from './user.routes.ts'
import { vehicleRouter } from '../modules/vehicle/vehicle.routes.ts'

export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/health', healthRouter)
apiRouter.use('/users', userRouter)
apiRouter.use('/audit-logs', auditLogRouter)
apiRouter.use('/ai-config', aiConfigRouter)
apiRouter.use('/knowledge', knowledgeRouter)
apiRouter.use('/vehicles', vehicleRouter)
apiRouter.use('/demo', demoRouter)
apiRouter.use('/tutorial', tutorialRouter)
apiRouter.use('/pg', pgApiRouter)
apiRouter.use('/ai', aiRouter)
