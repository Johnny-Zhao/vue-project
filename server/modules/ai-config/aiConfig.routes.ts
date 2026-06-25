import { Router } from 'express'
import {
  getAiFeedbackStats,
  getAiRuntimeConfig,
  putAiRuntimeConfig,
} from './aiConfig.controller.ts'
import { authorize, requireAuth } from '../../middleware/auth.ts'
import { requireJsonContent } from '../../middleware/requireJsonContent.ts'
import { validateBody } from '../../middleware/validateBody.ts'
import { asyncHandler } from '../../utils/asyncHandler.ts'
import { validateUpdateAiRuntimeConfigPayload } from './aiConfig.validator.ts'

export const aiConfigRouter = Router()

aiConfigRouter.use(requireAuth, authorize({ roles: ['admin'], permissions: ['ai:config'] }))

aiConfigRouter.get('/', asyncHandler(getAiRuntimeConfig))
aiConfigRouter.get('/feedback-stats', asyncHandler(getAiFeedbackStats))
aiConfigRouter.put(
  '/',
  requireJsonContent,
  validateBody(validateUpdateAiRuntimeConfigPayload),
  asyncHandler(putAiRuntimeConfig),
)
