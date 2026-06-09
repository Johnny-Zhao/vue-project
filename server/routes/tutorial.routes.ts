import { Router } from 'express'
import {
  deleteTask,
  getGuide,
  getTaskDetail,
  getTasks,
  postTask,
  putTask,
} from '../controllers/tutorialTask.controller.ts'
import { requireJsonContent } from '../middleware/requireJsonContent.ts'
import { validateBody } from '../middleware/validateBody.ts'
import { asyncHandler } from '../utils/asyncHandler.ts'
import { validateTutorialTaskPayload } from '../validators/tutorialTask.validator.ts'

export const tutorialRouter = Router()

tutorialRouter.get('/guide', asyncHandler(getGuide))
tutorialRouter.get('/tasks', asyncHandler(getTasks))
tutorialRouter.get('/tasks/:id', asyncHandler(getTaskDetail))
tutorialRouter.post(
  '/tasks',
  requireJsonContent,
  validateBody(validateTutorialTaskPayload),
  asyncHandler(postTask),
)
tutorialRouter.put(
  '/tasks/:id',
  requireJsonContent,
  validateBody(validateTutorialTaskPayload),
  asyncHandler(putTask),
)
tutorialRouter.delete('/tasks/:id', asyncHandler(deleteTask))
