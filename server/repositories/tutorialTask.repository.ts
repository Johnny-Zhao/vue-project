import { getDatabase } from '../database/sqlite.ts'
import type {
  TutorialTask,
  TutorialTaskFilters,
  TutorialTaskPayload,
  TutorialTaskRow,
} from '../types/tutorial.ts'

interface CountRow {
  count?: number | string
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

function buildTaskQuery(filters: TutorialTaskFilters) {
  const conditions: string[] = []
  const values: unknown[] = []

  if (filters.status) {
    conditions.push('status = ?')
    values.push(filters.status)
  }

  if (filters.keyword) {
    conditions.push('(title LIKE ? OR assignee LIKE ? OR description LIKE ?)')
    const keyword = `%${filters.keyword}%`
    values.push(keyword, keyword, keyword)
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  }
}

export async function listTutorialTasks(filters: TutorialTaskFilters) {
  const db = getDatabase()
  const { whereClause, values } = buildTaskQuery(filters)
  const offset = (filters.page - 1) * filters.pageSize

  const rows = db
    .prepare<TutorialTaskRow>(
      `
        SELECT
          id,
          title,
          status,
          priority,
          assignee,
          description,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM tutorial_tasks
        ${whereClause}
        ORDER BY updated_at DESC, id DESC
        LIMIT ?
        OFFSET ?;
      `,
    )
    .all(...values, filters.pageSize, offset)

  const countRow = db
    .prepare<CountRow>(
      `
        SELECT COUNT(*) AS count
        FROM tutorial_tasks
        ${whereClause};
      `,
    )
    .get(...values)

  return {
    list: rows.map((row) => mapTaskRow(row)).filter((item): item is TutorialTask => item !== null),
    total: Number(countRow?.count || 0),
  }
}

export async function getTutorialTaskById(id: number) {
  const db = getDatabase()
  const row = db
    .prepare<TutorialTaskRow>(
      `
        SELECT
          id,
          title,
          status,
          priority,
          assignee,
          description,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM tutorial_tasks
        WHERE id = ?
        LIMIT 1;
      `,
    )
    .get(Number(id))

  return mapTaskRow(row)
}

export async function createTutorialTask(payload: TutorialTaskPayload) {
  const db = getDatabase()
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `
        INSERT INTO tutorial_tasks (title, status, priority, assignee, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      payload.title,
      payload.status,
      payload.priority,
      payload.assignee,
      payload.description,
      now,
      now,
    )

  return getTutorialTaskById(Number(result.lastInsertRowid))
}

export async function updateTutorialTask(id: number, payload: TutorialTaskPayload) {
  const db = getDatabase()
  const now = new Date().toISOString()

  db.prepare(
    `
      UPDATE tutorial_tasks
      SET
        title = ?,
        status = ?,
        priority = ?,
        assignee = ?,
        description = ?,
        updated_at = ?
      WHERE id = ?
    `,
  ).run(
    payload.title,
    payload.status,
    payload.priority,
    payload.assignee,
    payload.description,
    now,
    Number(id),
  )

  return getTutorialTaskById(Number(id))
}

export async function deleteTutorialTask(id: number) {
  const db = getDatabase()
  const existingTask = await getTutorialTaskById(Number(id))

  if (!existingTask) {
    return null
  }

  db.prepare('DELETE FROM tutorial_tasks WHERE id = ?').run(Number(id))
  return existingTask.id
}
