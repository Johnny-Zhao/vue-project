import { Router } from 'express'
import { getAuditLogs } from '../controllers/auditLog.controller.ts'
import { authorize, requireAuth } from '../middleware/auth.ts'
import { asyncHandler } from '../utils/asyncHandler.ts'

export const auditLogRouter = Router()

auditLogRouter.use(requireAuth, authorize({ roles: ['admin'] }))

auditLogRouter.get('/', asyncHandler(getAuditLogs))
