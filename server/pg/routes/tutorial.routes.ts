import { Router } from 'express'
import {
  deleteTask,
  getGuide,
  getTaskDetail,
  getTasks,
  postTask,
  putTask,
} from '../controllers/tutorialTask.controller.ts'
import { authorize, requireAuth } from '../../middleware/auth.ts'
import { requireJsonContent } from '../../middleware/requireJsonContent.ts'
import { validateBody } from '../../middleware/validateBody.ts'
import { asyncHandler } from '../../utils/asyncHandler.ts'
import { validateTutorialTaskPayload } from '../../validators/tutorialTask.validator.ts'

export const pgTutorialRouter = Router()

pgTutorialRouter.use(requireAuth)

pgTutorialRouter.get('/guide', authorize({ roles: ['admin', 'viewer'] }), asyncHandler(getGuide))
pgTutorialRouter.get('/tasks', authorize({ roles: ['admin', 'viewer'] }), asyncHandler(getTasks))
pgTutorialRouter.get(
  '/tasks/:id',
  authorize({ roles: ['admin', 'viewer'] }),
  asyncHandler(getTaskDetail),
)
pgTutorialRouter.post(
  '/tasks',
  authorize({ roles: ['admin'], permissions: ['task:create'] }),
  requireJsonContent,
  validateBody(validateTutorialTaskPayload),
  asyncHandler(postTask),
)
pgTutorialRouter.put(
  '/tasks/:id',
  authorize({ roles: ['admin'], permissions: ['task:edit'] }),
  requireJsonContent,
  validateBody(validateTutorialTaskPayload),
  asyncHandler(putTask),
)
pgTutorialRouter.delete(
  '/tasks/:id',
  authorize({ roles: ['admin'], permissions: ['task:delete'] }),
  asyncHandler(deleteTask),
)
