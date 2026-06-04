import {
  createTutorialTask,
  getTutorialGuide,
  getTutorialTaskDetail,
  listTutorialTasks,
  removeTutorialTask,
  updateTutorialTask,
} from '../services/tutorialTask.service.js'
import { createSuccessResponse } from '../utils/apiResponse.js'

export async function getGuide(_req, res) {
  res.json(createSuccessResponse(getTutorialGuide(), '已返回 Node + SQLite 学习说明'))
}

export async function getTasks(req, res) {
  const data = await listTutorialTasks({
    status: req.query.status,
    keyword: req.query.keyword,
    page: req.query.page,
    pageSize: req.query.pageSize,
  })

  res.json(createSuccessResponse(data, '已返回 SQLite 分页任务列表'))
}

export async function getTaskDetail(req, res) {
  const task = await getTutorialTaskDetail(req.params.id)
  res.json(createSuccessResponse(task, '已返回任务详情'))
}

export async function postTask(req, res) {
  const task = await createTutorialTask(req.validatedBody)
  res.status(201).json(createSuccessResponse(task, '任务创建成功', 201))
}

export async function putTask(req, res) {
  const task = await updateTutorialTask(req.params.id, req.validatedBody)
  res.json(createSuccessResponse(task, '任务更新成功'))
}

export async function deleteTask(req, res) {
  const result = await removeTutorialTask(req.params.id)
  res.json(createSuccessResponse(result, '任务删除成功'))
}
