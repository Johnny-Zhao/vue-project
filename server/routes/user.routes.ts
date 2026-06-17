import { Router } from 'express'
import {
  deleteUser,
  getUserById,
  getUsers,
  postUser,
  putUser,
} from '../controllers/user.controller.ts'
import { authorize, requireAuth } from '../middleware/auth.ts'
import { requireJsonContent } from '../middleware/requireJsonContent.ts'
import { validateBody } from '../middleware/validateBody.ts'
import { asyncHandler } from '../utils/asyncHandler.ts'
import {
  validateCreateUserPayload,
  validateUpdateUserPayload,
} from '../validators/user.validator.ts'

export const userRouter = Router()

userRouter.use(requireAuth, authorize({ roles: ['admin'], permissions: ['user:manage'] }))

userRouter.get('/', asyncHandler(getUsers))
userRouter.get('/:id', asyncHandler(getUserById))
userRouter.post(
  '/',
  requireJsonContent,
  validateBody(validateCreateUserPayload),
  asyncHandler(postUser),
)
userRouter.put(
  '/:id',
  requireJsonContent,
  validateBody(validateUpdateUserPayload),
  asyncHandler(putUser),
)
userRouter.delete('/:id', asyncHandler(deleteUser))
