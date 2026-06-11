import type { TutorialTaskPayload } from '../../types/tutorial.ts'
import type { ServerRequestHandler } from '../../types/http.ts'
import {
  createTutorialTask,
  getTutorialGuide,
  getTutorialTaskDetail,
  listTutorialTasks,
  removeTutorialTask,
  updateTutorialTask,
} from '../services/tutorialTask.service.ts'
import { createSuccessResponse } from '../../utils/apiResponse.ts'

export const getGuide: ServerRequestHandler = (_req, res) => {
  res.json(createSuccessResponse(getTutorialGuide(), '已返回 PostgreSQL 教学说明'))
}

export const getTasks: ServerRequestHandler = async (req, res) => {
  const data = await listTutorialTasks(req.query)

  res.json(createSuccessResponse(data, '已返回 PostgreSQL 分页任务列表'))
}

export const getTaskDetail: ServerRequestHandler = async (req, res) => {
  const task = await getTutorialTaskDetail(req.params.id)
  res.json(createSuccessResponse(task, '已返回 PostgreSQL 任务详情'))
}

export const postTask: ServerRequestHandler = async (req, res) => {
  const task = await createTutorialTask(req.validatedBody as TutorialTaskPayload)
  res.status(201).json(createSuccessResponse(task, 'PostgreSQL 任务创建成功', 201))
}

export const putTask: ServerRequestHandler = async (req, res) => {
  const task = await updateTutorialTask(req.params.id, req.validatedBody as TutorialTaskPayload)
  res.json(createSuccessResponse(task, 'PostgreSQL 任务更新成功'))
}

export const deleteTask: ServerRequestHandler = async (req, res) => {
  const result = await removeTutorialTask(req.params.id)
  res.json(createSuccessResponse(result, 'PostgreSQL 任务删除成功'))
}
