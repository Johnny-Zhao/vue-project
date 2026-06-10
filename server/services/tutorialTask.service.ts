import { env } from '../config/env.ts'
import type {
  TutorialGuide,
  TutorialTaskFilters,
  TutorialTaskPageResult,
  TutorialTaskPayload,
  TutorialTaskSortField,
  TutorialTaskSortOrder,
} from '../types/tutorial.ts'
import {
  createTutorialTask as createTutorialTaskRecord,
  deleteTutorialTask as deleteTutorialTaskRecord,
  getTutorialTaskById,
  listTutorialTasks as listTutorialTaskRecords,
  updateTutorialTask as updateTutorialTaskRecord,
} from '../repositories/tutorialTask.repository.ts'
import { AppError } from '../utils/appError.ts'

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
    title: 'Node + SQLite CRUD Guide',
    summary:
      'This module uses a real SQLite database to walk through a complete Express CRUD request flow.',
    flowSteps: [
      'The page calls src/api/tutorialTasks.ts.',
      'The route in server/routes/tutorial.routes.ts matches the request URL.',
      'Middleware handles request id, logging, and request body validation first.',
      'The controller only reads params and returns the response.',
      'The service layer handles business rules and throws typed errors.',
      'The repository reads and writes tutorial.sqlite through better-sqlite3.',
    ],
    middlewares: [
      {
        name: 'requestContext',
        role: 'Adds a request id to each request and writes it into the response headers.',
      },
      {
        name: 'requestLogger',
        role: 'Prints method, url, status, and duration after the request finishes.',
      },
      {
        name: 'requireJsonContent',
        role: 'Restricts POST and PUT requests to application/json bodies.',
      },
      {
        name: 'validateBody',
        role: 'Cleans and validates request payloads before the controller runs.',
      },
      {
        name: 'errorHandler',
        role: 'Catches exceptions in one place and returns structured error responses.',
      },
    ],
    endpoints: [
      {
        method: 'GET',
        path: '/api/tutorial/guide',
        description: 'Return the learning guide and middleware list.',
      },
      {
        method: 'GET',
        path: '/api/tutorial/tasks',
        description: 'Query paged task data with status and keyword filters.',
      },
      { method: 'GET', path: '/api/tutorial/tasks/:id', description: 'Return one task by id.' },
      { method: 'POST', path: '/api/tutorial/tasks', description: 'Create a task.' },
      { method: 'PUT', path: '/api/tutorial/tasks/:id', description: 'Update a task.' },
      { method: 'DELETE', path: '/api/tutorial/tasks/:id', description: 'Delete a task.' },
    ],
    database: {
      engine: 'SQLite',
      command: 'better-sqlite3',
      file: env.sqliteDbPath,
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
