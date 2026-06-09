import { Router } from 'express'
import {
  getOverview,
  getStructure,
  getTaskDetail,
  getTasks,
  postEcho,
} from '../controllers/demo.controller.ts'

export const demoRouter = Router()

demoRouter.get('/overview', getOverview)
demoRouter.get('/structure', getStructure)
demoRouter.get('/tasks', getTasks)
demoRouter.get('/tasks/:id', getTaskDetail)
demoRouter.post('/echo', postEcho)
