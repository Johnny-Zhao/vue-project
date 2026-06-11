import { getPostgresPool } from '../database/postgres.ts'
import type {
  TutorialTask,
  TutorialTaskFilters,
  TutorialTaskListQuery,
  TutorialTaskPayload,
  TutorialTaskRow,
  TutorialTaskSortField,
} from '../../types/tutorial.ts'

interface CountRow {
  count?: number | string
}

interface IdRow {
  id?: number | string
}

const sortColumnMap: Record<TutorialTaskSortField, string> = {
  id: 'id',
  title: 'title',
  status: 'status',
  priority: 'priority',
  assignee: 'assignee',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

function mapTaskRow(row?: TutorialTaskRow | null): TutorialTask | null {
  if (!row) {
    return null
  }

  return {
    id: Number(row.id),
    title: row.title,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function buildTaskQuery(filters: TutorialTaskFilters): TutorialTaskListQuery {
  const conditions: string[] = []
  const values: unknown[] = []
  const hasCustomSort = Boolean(filters.sortField && filters.sortOrder)

  if (filters.status) {
    values.push(filters.status)
    conditions.push(`status = $${values.length}`)
  }

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`
    values.push(keyword, keyword, keyword)
    const startIndex = values.length - 2
    conditions.push(
      `(title ILIKE $${startIndex} OR assignee ILIKE $${startIndex + 1} OR description ILIKE $${startIndex + 2})`,
    )
  }

  const sortColumn =
    hasCustomSort && filters.sortField ? sortColumnMap[filters.sortField] : 'updated_at'
  const sortDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC'
  const orderByClause = hasCustomSort
    ? `ORDER BY ${sortColumn} ${sortDirection}, id DESC`
    : 'ORDER BY updated_at DESC, id DESC'

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    orderByClause,
    values,
  }
}

export async function listTutorialTasks(filters: TutorialTaskFilters) {
  const pool = await getPostgresPool()
  const { whereClause, orderByClause, values } = buildTaskQuery(filters)
  const offset = (filters.page - 1) * filters.pageSize
  const pagingValues = [...values, filters.pageSize, offset]
  const limitIndex = pagingValues.length - 1
  const offsetIndex = pagingValues.length

  const rowResult = await pool.query<TutorialTaskRow>(
    `
      SELECT
        id,
        title,
        status,
        priority,
        assignee,
        description,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM tutorial_tasks
      ${whereClause}
      ${orderByClause}
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex};
    `,
    pagingValues,
  )

  const countResult = await pool.query<CountRow>(
    `
      SELECT COUNT(*)::text AS count
      FROM tutorial_tasks
      ${whereClause};
    `,
    values,
  )

  return {
    list: rowResult.rows
      .map((row) => mapTaskRow(row))
      .filter((item): item is TutorialTask => item !== null),
    total: Number(countResult.rows[0]?.count || 0),
  }
}

export async function getTutorialTaskById(id: number) {
  const pool = await getPostgresPool()
  const result = await pool.query<TutorialTaskRow>(
    `
      SELECT
        id,
        title,
        status,
        priority,
        assignee,
        description,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM tutorial_tasks
      WHERE id = $1
      LIMIT 1;
    `,
    [Number(id)],
  )

  return mapTaskRow(result.rows[0] ?? null)
}

export async function createTutorialTask(payload: TutorialTaskPayload) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()
  const result = await pool.query<IdRow>(
    `
      INSERT INTO tutorial_tasks (title, status, priority, assignee, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `,
    [
      payload.title,
      payload.status,
      payload.priority,
      payload.assignee,
      payload.description,
      now,
      now,
    ],
  )

  return getTutorialTaskById(Number(result.rows[0]?.id))
}

export async function updateTutorialTask(id: number, payload: TutorialTaskPayload) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()

  await pool.query(
    `
      UPDATE tutorial_tasks
      SET
        title = $1,
        status = $2,
        priority = $3,
        assignee = $4,
        description = $5,
        updated_at = $6
      WHERE id = $7;
    `,
    [
      payload.title,
      payload.status,
      payload.priority,
      payload.assignee,
      payload.description,
      now,
      Number(id),
    ],
  )

  return getTutorialTaskById(Number(id))
}

export async function deleteTutorialTask(id: number) {
  const existingTask = await getTutorialTaskById(Number(id))

  if (!existingTask) {
    return null
  }

  const pool = await getPostgresPool()
  await pool.query('DELETE FROM tutorial_tasks WHERE id = $1', [Number(id)])
  return existingTask.id
}
