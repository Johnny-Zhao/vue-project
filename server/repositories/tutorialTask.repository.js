import { getDatabase } from '../database/sqlite.js'

function mapTaskRow(row) {
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

function buildTaskQuery(filters = {}) {
  const conditions = []
  const values = []

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

export async function listTutorialTasks(filters = {}) {
  const db = getDatabase()
  const { whereClause, values } = buildTaskQuery(filters)
  const page = Number(filters.page || 1)
  const pageSize = Number(filters.pageSize || 10)
  const offset = (page - 1) * pageSize

  const rows = db
    .prepare(
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
    .all(...values, pageSize, offset)

  const countRow = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM tutorial_tasks
        ${whereClause};
      `,
    )
    .get(...values)

  return {
    list: rows.map(mapTaskRow),
    total: Number(countRow?.count || 0),
  }
}

export async function getTutorialTaskById(id) {
  const db = getDatabase()
  const row = db
    .prepare(
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

export async function createTutorialTask(payload) {
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

export async function updateTutorialTask(id, payload) {
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

export async function deleteTutorialTask(id) {
  const db = getDatabase()
  const existingTask = await getTutorialTaskById(Number(id))

  if (!existingTask) {
    return null
  }

  db.prepare('DELETE FROM tutorial_tasks WHERE id = ?').run(Number(id))
  return existingTask.id
}
