import type { ServerRequestHandler } from '../types/http.ts'
import {
  createEchoPayload,
  getDemoTaskById,
  getExpressOverview,
  getExpressStructure,
  listDemoTasks,
} from '../services/demo.service.ts'
import { createFailureResponse, createSuccessResponse } from '../utils/apiResponse.ts'

export const getOverview: ServerRequestHandler = (_req, res) => {
  res.json(createSuccessResponse(getExpressOverview(), '已返回 Express 学习概览'))
}

export const getStructure: ServerRequestHandler = (_req, res) => {
  res.json(createSuccessResponse(getExpressStructure(), '已返回 Express 目录结构说明'))
}

export const getTasks: ServerRequestHandler = (_req, res) => {
  res.json(createSuccessResponse(listDemoTasks(), '已返回示例任务列表'))
}

export const getTaskDetail: ServerRequestHandler = (req, res) => {
  const taskId = Number(req.params.id)
  const task = getDemoTaskById(taskId)

  if (!task) {
    res.status(404).json(createFailureResponse(`未找到 id 为 ${taskId} 的示例任务。`, 404))
    return
  }

  res.json(createSuccessResponse(task, '已返回示例任务详情'))
}

export const postEcho: ServerRequestHandler = (req, res) => {
  res.json(createSuccessResponse(createEchoPayload(req.body), '已返回请求体回显结果'))
}
