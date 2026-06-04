import { env } from '../config/env.js'
import {
  createTutorialTask as createTutorialTaskRecord,
  deleteTutorialTask as deleteTutorialTaskRecord,
  getTutorialTaskById,
  listTutorialTasks as listTutorialTaskRecords,
  updateTutorialTask as updateTutorialTaskRecord,
} from '../repositories/tutorialTask.repository.js'
import { AppError } from '../utils/appError.js'

function parseTaskId(rawId) {
  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('任务 id 必须是正整数。', 400)
  }

  return id
}

function parsePositiveInt(value, fallback) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

export function getTutorialGuide() {
  return {
    title: 'Node + SQLite CRUD 学习页',
    summary: '这个模块用真实 SQLite 做了一套任务增删改查，方便你把 Express 的请求链路完整走一遍。',
    flowSteps: [
      '前端页面调用 src/api/tutorialTasks.ts',
      '路由 server/routes/tutorial.routes.js 匹配请求地址',
      '中间件先处理 requestId、日志和请求体校验',
      '控制器只负责收参和返回响应',
      '服务层处理业务规则和错误抛出',
      '仓储层通过 better-sqlite3 直接读写 tutorial.sqlite 文件',
    ],
    middlewares: [
      {
        name: 'requestContext',
        role: '给每个请求分配 requestId，并写入响应头，方便日志追踪。',
      },
      {
        name: 'requestLogger',
        role: '在请求结束后打印 method、url、status 和耗时。',
      },
      {
        name: 'requireJsonContent',
        role: '限制 POST / PUT 只能接收 application/json。',
      },
      {
        name: 'validateBody',
        role: '在进入 controller 前完成参数清洗和字段校验。',
      },
      {
        name: 'errorHandler',
        role: '统一捕获异常，输出结构化错误响应。',
      },
    ],
    endpoints: [
      { method: 'GET', path: '/api/tutorial/guide', description: '返回学习说明和中间件清单。' },
      {
        method: 'GET',
        path: '/api/tutorial/tasks',
        description: '分页查询任务列表，支持 status / keyword 过滤。',
      },
      { method: 'GET', path: '/api/tutorial/tasks/:id', description: '查询单条任务详情。' },
      { method: 'POST', path: '/api/tutorial/tasks', description: '新增一条任务。' },
      { method: 'PUT', path: '/api/tutorial/tasks/:id', description: '更新一条任务。' },
      { method: 'DELETE', path: '/api/tutorial/tasks/:id', description: '删除一条任务。' },
    ],
    database: {
      engine: 'SQLite',
      command: 'better-sqlite3',
      file: env.sqliteDbPath,
      table: 'tutorial_tasks',
    },
  }
}

export async function listTutorialTasks(filters = {}) {
  const status =
    typeof filters.status === 'string' && filters.status !== 'all' ? filters.status : ''
  const keyword = typeof filters.keyword === 'string' ? filters.keyword.trim().slice(0, 50) : ''
  const page = parsePositiveInt(filters.page, 1)
  const pageSize = Math.min(parsePositiveInt(filters.pageSize, 10), 50)

  const result = await listTutorialTaskRecords({
    status,
    keyword,
    page,
    pageSize,
  })

  return {
    list: result.list,
    total: result.total,
    page,
    pageSize,
  }
}

export async function getTutorialTaskDetail(rawId) {
  const id = parseTaskId(rawId)
  const task = await getTutorialTaskById(id)

  if (!task) {
    throw new AppError(`未找到 id 为 ${id} 的任务。`, 404)
  }

  return task
}

export async function createTutorialTask(payload) {
  return createTutorialTaskRecord(payload)
}

export async function updateTutorialTask(rawId, payload) {
  const id = parseTaskId(rawId)
  const currentTask = await getTutorialTaskById(id)

  if (!currentTask) {
    throw new AppError(`未找到 id 为 ${id} 的任务。`, 404)
  }

  return updateTutorialTaskRecord(id, payload)
}

export async function removeTutorialTask(rawId) {
  const id = parseTaskId(rawId)
  const deletedId = await deleteTutorialTaskRecord(id)

  if (!deletedId) {
    throw new AppError(`未找到 id 为 ${id} 的任务。`, 404)
  }

  return {
    id: deletedId,
    deleted: true,
  }
}
