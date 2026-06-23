import { Router } from 'express'
import { getCurrentUser, postLogin } from './auth.controller.ts'
import { requireAuth } from '../../middleware/auth.ts'
import { requireJsonContent } from '../../middleware/requireJsonContent.ts'
import { asyncHandler } from '../../utils/asyncHandler.ts'

export const authRouter = Router()

authRouter.post('/login', requireJsonContent, asyncHandler(postLogin))
authRouter.get('/me', requireAuth, asyncHandler(getCurrentUser))
