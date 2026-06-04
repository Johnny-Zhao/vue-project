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

export async function listTutorialTasks(filters = {}) {
  const db = getDatabase()
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

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
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
    ORDER BY updated_at DESC, id DESC;
  `,
    )
    .all(...values)

  return rows.map(mapTaskRow)
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

export async function getTutorialTaskCount() {
  const db = getDatabase()
  const row = db.prepare('SELECT COUNT(*) AS count FROM tutorial_tasks').get()
  return Number(row?.count || 0)
}
