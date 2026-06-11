import { env } from '../../config/env.ts'
import type {
  TutorialGuide,
  TutorialTaskFilters,
  TutorialTaskPageResult,
  TutorialTaskPayload,
  TutorialTaskSortField,
  TutorialTaskSortOrder,
} from '../../types/tutorial.ts'
import {
  createTutorialTask as createTutorialTaskRecord,
  deleteTutorialTask as deleteTutorialTaskRecord,
  getTutorialTaskById,
  listTutorialTasks as listTutorialTaskRecords,
  updateTutorialTask as updateTutorialTaskRecord,
} from '../repositories/tutorialTask.repository.ts'
import { AppError } from '../../utils/appError.ts'

function parseTaskId(rawId: unknown) {
  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Task id must be a positive integer.', 400)
  }

  return id
}

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

const allowedSortFields: TutorialTaskSortField[] = [
  'id',
  'title',
  'status',
  'priority',
  'assignee',
  'createdAt',
  'updatedAt',
]

function parseSortField(value: unknown): TutorialTaskSortField | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  return allowedSortFields.includes(value as TutorialTaskSortField)
    ? (value as TutorialTaskSortField)
    : undefined
}

function parseSortOrder(value: unknown): TutorialTaskSortOrder | undefined {
  if (value === 'asc' || value === 'desc') {
    return value
  }

  return undefined
}

export function getTutorialGuide(): TutorialGuide {
  return {
    title: 'Node + PostgreSQL CRUD 指南',
    summary: '这个模块使用真实的 PostgreSQL 数据库，演示一套完整的 Express CRUD 请求链路。',
    flowSteps: [
      '页面调用 PostgreSQL 专用的前端 API 模块。',
      'server/pg/routes/tutorial.routes.ts 匹配请求路径。',
      '中间件先处理 requestId、日志和请求体校验。',
      'controller 只负责读取参数并返回响应。',
      'service 负责分页、筛选和排序规则校验。',
      'repository 通过 pg 驱动读写 tutorial_tasks 表。',
    ],
    middlewares: [
      {
        name: 'requestContext',
        role: '给每个请求生成 requestId，并写入响应头。',
      },
      {
        name: 'requestLogger',
        role: '在请求结束后输出 method、url、status 和耗时。',
      },
      {
        name: 'requireJsonContent',
        role: '限制 POST 和 PUT 请求必须使用 application/json。',
      },
      {
        name: 'validateBody',
        role: '在进入 controller 前清洗并校验请求体。',
      },
      {
        name: 'errorHandler',
        role: '统一捕获异常并返回结构化错误响应。',
      },
    ],
    endpoints: [
      {
        method: 'GET',
        path: '/api/pg/tutorial/guide',
        description: '返回 PostgreSQL 教学说明和中间件列表。',
      },
      {
        method: 'GET',
        path: '/api/pg/tutorial/tasks',
        description: '查询带分页、筛选和排序的 PostgreSQL 任务列表。',
      },
      {
        method: 'GET',
        path: '/api/pg/tutorial/tasks/:id',
        description: '按 id 查询一条 PostgreSQL 任务。',
      },
      { method: 'POST', path: '/api/pg/tutorial/tasks', description: '创建一条 PostgreSQL 任务。' },
      {
        method: 'PUT',
        path: '/api/pg/tutorial/tasks/:id',
        description: '更新一条 PostgreSQL 任务。',
      },
      {
        method: 'DELETE',
        path: '/api/pg/tutorial/tasks/:id',
        description: '删除一条 PostgreSQL 任务。',
      },
    ],
    database: {
      engine: 'PostgreSQL',
      command: 'pg',
      file: `${env.postgresHost}:${env.postgresPort}/${env.postgresDatabase}`,
      table: 'tutorial_tasks',
    },
  }
}

export async function listTutorialTasks(
  filters: Partial<TutorialTaskFilters> & Record<string, unknown> = {},
): Promise<TutorialTaskPageResult> {
  const status =
    typeof filters.status === 'string' && filters.status !== 'all' ? filters.status : ''
  const keyword = typeof filters.keyword === 'string' ? filters.keyword.trim().slice(0, 50) : ''
  const page = parsePositiveInt(filters.page, 1)
  const pageSize = Math.min(parsePositiveInt(filters.pageSize, 10), 50)
  const sortField = parseSortField(filters.sortField)
  const sortOrder = parseSortOrder(filters.sortOrder)

  const result = await listTutorialTaskRecords({
    status,
    keyword,
    page,
    pageSize,
    sortField,
    sortOrder,
  })

  return {
    list: result.list,
    total: result.total,
    page,
    pageSize,
  }
}

export async function getTutorialTaskDetail(rawId: unknown) {
  const id = parseTaskId(rawId)
  const task = await getTutorialTaskById(id)

  if (!task) {
    throw new AppError(`Task with id ${id} was not found.`, 404)
  }

  return task
}

export async function createTutorialTask(payload: TutorialTaskPayload) {
  return createTutorialTaskRecord(payload)
}

export async function updateTutorialTask(rawId: unknown, payload: TutorialTaskPayload) {
  const id = parseTaskId(rawId)
  const currentTask = await getTutorialTaskById(id)

  if (!currentTask) {
    throw new AppError(`Task with id ${id} was not found.`, 404)
  }

  return updateTutorialTaskRecord(id, payload)
}

export async function removeTutorialTask(rawId: unknown) {
  const id = parseTaskId(rawId)
  const deletedId = await deleteTutorialTaskRecord(id)

  if (!deletedId) {
    throw new AppError(`Task with id ${id} was not found.`, 404)
  }

  return {
    id: deletedId,
    deleted: true,
  }
}
