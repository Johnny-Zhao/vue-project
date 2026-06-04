import { Router } from 'express'
import {
  deleteTask,
  getGuide,
  getTaskDetail,
  getTasks,
  postTask,
  putTask,
} from '../controllers/tutorialTask.controller.js'
import { requireJsonContent } from '../middleware/requireJsonContent.js'
import { validateBody } from '../middleware/validateBody.js'
import { validateTutorialTaskPayload } from '../validators/tutorialTask.validator.js'
import { asyncHandler } from '../utils/asyncHandler.js'

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
