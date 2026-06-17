import { Router } from 'express'
import {
  getOverview,
  getStructure,
  getTaskDetail,
  getTasks,
  postEcho,
} from '../controllers/demo.controller.ts'
import { authorize, requireAuth } from '../middleware/auth.ts'

export const demoRouter = Router()

demoRouter.use(requireAuth, authorize({ roles: ['admin', 'viewer'] }))

demoRouter.get('/overview', getOverview)
demoRouter.get('/structure', getStructure)
demoRouter.get('/tasks', getTasks)
demoRouter.get('/tasks/:id', getTaskDetail)
demoRouter.post('/echo', postEcho)
