import { Router } from 'express'
import {
  deleteTask,
  getGuide,
  getTaskDetail,
  getTasks,
  postTask,
  putTask,
} from '../controllers/tutorialTask.controller.ts'
import { requireJsonContent } from '../../middleware/requireJsonContent.ts'
import { validateBody } from '../../middleware/validateBody.ts'
import { asyncHandler } from '../../utils/asyncHandler.ts'
import { validateTutorialTaskPayload } from '../../validators/tutorialTask.validator.ts'

export const pgTutorialRouter = Router()

pgTutorialRouter.get('/guide', asyncHandler(getGuide))
pgTutorialRouter.get('/tasks', asyncHandler(getTasks))
pgTutorialRouter.get('/tasks/:id', asyncHandler(getTaskDetail))
pgTutorialRouter.post(
  '/tasks',
  requireJsonContent,
  validateBody(validateTutorialTaskPayload),
  asyncHandler(postTask),
)
pgTutorialRouter.put(
  '/tasks/:id',
  requireJsonContent,
  validateBody(validateTutorialTaskPayload),
  asyncHandler(putTask),
)
pgTutorialRouter.delete('/tasks/:id', asyncHandler(deleteTask))
