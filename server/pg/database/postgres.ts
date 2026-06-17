import { Pool } from 'pg'
import { env } from '../../config/env.ts'

let pool: Pool | null = null
let initialized = false

function createPool() {
  return new Pool({
    host: env.postgresHost,
    port: env.postgresPort,
    database: env.postgresDatabase,
    user: env.postgresUser,
    password: env.postgresPassword,
    ssl: env.postgresSsl ? { rejectUnauthorized: false } : false,
  })
}

async function initializeDatabase(connection: Pool) {
  if (initialized) {
    return
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(30) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL,
      name VARCHAR(30) NOT NULL,
      role VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS tutorial_tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(60) NOT NULL,
      status VARCHAR(20) NOT NULL,
      priority VARCHAR(20) NOT NULL,
      assignee VARCHAR(30) NOT NULL DEFAULT '',
      description VARCHAR(300) NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `)

  const userCountResult = await connection.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM app_users',
  )
  const userTotal = Number(userCountResult.rows[0]?.count || 0)

  if (userTotal === 0) {
    const now = new Date().toISOString()
    await connection.query(
      `
        INSERT INTO app_users (username, password, name, role, status, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7),
          ($8, $9, $10, $11, $12, $13, $14)
      `,
      [
        'admin',
        '123456',
        'Admin User',
        'admin',
        'active',
        now,
        now,
        'viewer',
        '123456',
        'Viewer User',
        'viewer',
        'active',
        now,
        now,
      ],
    )
  }

  const taskCountResult = await connection.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM tutorial_tasks',
  )
  const total = Number(taskCountResult.rows[0]?.count || 0)

  if (total === 0) {
    const now = new Date().toISOString()
    await connection.query(
      `
        INSERT INTO tutorial_tasks (title, status, priority, assignee, description, created_at, updated_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7),
          ($8, $9, $10, $11, $12, $13, $14),
          ($15, $16, $17, $18, $19, $20, $21)
      `,
      [
        'Understand Express request flow',
        'doing',
        'high',
        'Backend',
        'Trace one request through route, controller, service, repository, and PostgreSQL.',
        now,
        now,
        'Add request logging middleware',
        'todo',
        'medium',
        'Node',
        'Make each request print requestId, status code, and duration.',
        now,
        now,
        'Build a frontend CRUD demo',
        'done',
        'medium',
        'Frontend',
        'Use a real PostgreSQL table to drive create, edit, delete, and filter flows.',
        now,
        now,
      ],
    )
  }

  initialized = true
}

export async function getPostgresPool() {
  if (!pool) {
    pool = createPool()
  }

  await initializeDatabase(pool)
  return pool
}
