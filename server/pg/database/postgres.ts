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
    CREATE TABLE IF NOT EXISTS fleet_vehicles (
      id SERIAL PRIMARY KEY,
      plate_number VARCHAR(20) NOT NULL UNIQUE,
      vehicle_type VARCHAR(20) NOT NULL,
      drive_type VARCHAR(20) NOT NULL,
      energy_type VARCHAR(20) NOT NULL,
      brand_model VARCHAR(60) NOT NULL,
      vin VARCHAR(30) NOT NULL DEFAULT '',
      axle_count INTEGER,
      load_capacity DOUBLE PRECISION,
      status VARCHAR(20) NOT NULL,
      remark VARCHAR(300) NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      created_by INTEGER NOT NULL,
      created_by_name VARCHAR(30) NOT NULL,
      updated_by INTEGER NOT NULL,
      updated_by_name VARCHAR(30) NOT NULL
    );
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS vehicle_ai_analysis (
      vehicle_id INTEGER PRIMARY KEY REFERENCES fleet_vehicles (id) ON DELETE CASCADE,
      summary_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      risks_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      next_actions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      confidence VARCHAR(20) NOT NULL,
      source VARCHAR(20) NOT NULL,
      generated_at TIMESTAMPTZ NOT NULL,
      notice VARCHAR(300),
      source_updated_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS vehicle_ai_feedback (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER NOT NULL REFERENCES fleet_vehicles (id) ON DELETE CASCADE,
      feedback_type VARCHAR(20) NOT NULL,
      comment VARCHAR(300) NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL,
      created_by_id INTEGER NOT NULL,
      created_by_name VARCHAR(30) NOT NULL
    );
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_runtime_config (
      id INTEGER PRIMARY KEY,
      model VARCHAR(60) NOT NULL,
      request_timeout_ms INTEGER NOT NULL,
      enable_cache BOOLEAN NOT NULL,
      allow_manual_refresh BOOLEAN NOT NULL,
      suggest_refresh_on_source_change BOOLEAN NOT NULL,
      openai_store BOOLEAN NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      updated_by INTEGER NOT NULL,
      updated_by_name VARCHAR(30) NOT NULL
    );
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      module VARCHAR(40) NOT NULL,
      action VARCHAR(20) NOT NULL,
      entity_id INTEGER NOT NULL,
      entity_name VARCHAR(120) NOT NULL,
      before_data JSONB,
      after_data JSONB,
      operator_id INTEGER NOT NULL,
      operator_name VARCHAR(30) NOT NULL,
      request_id VARCHAR(80) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `)

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
  const taskTotal = Number(taskCountResult.rows[0]?.count || 0)

  if (taskTotal === 0) {
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

  const vehicleCountResult = await connection.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM fleet_vehicles',
  )
  const vehicleTotal = Number(vehicleCountResult.rows[0]?.count || 0)

  if (vehicleTotal === 0) {
    const now = new Date().toISOString()
    await connection.query(
      `
        INSERT INTO fleet_vehicles (
          plate_number,
          vehicle_type,
          drive_type,
          energy_type,
          brand_model,
          vin,
          axle_count,
          load_capacity,
          status,
          remark,
          created_at,
          updated_at,
          created_by,
          created_by_name,
          updated_by,
          updated_by_name
        )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16),
          ($17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32),
          ($33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48)
      `,
      [
        'SU-A12345',
        'tractor',
        '6x4',
        'diesel',
        'FAW J6P',
        'LNBSCB3H0GA000001',
        3,
        32,
        'active',
        'Primary line-haul tractor.',
        now,
        now,
        1,
        'Admin User',
        1,
        'Admin User',
        'SH-B67890',
        'truck',
        '4x2',
        'electric',
        'BYD T5',
        'LNBSCB3H0GA000002',
        2,
        8,
        'maintenance',
        'City delivery vehicle under maintenance.',
        now,
        now,
        1,
        'Admin User',
        1,
        'Admin User',
        'GD-C24680',
        'van',
        '4x2',
        'hybrid',
        'Foton Scenic',
        'LNBSCB3H0GA000003',
        2,
        3.5,
        'inactive',
        'Backup vehicle not currently dispatched.',
        now,
        now,
        1,
        'Admin User',
        1,
        'Admin User',
      ],
    )
  }

  const aiConfigCountResult = await connection.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM ai_runtime_config',
  )
  const aiConfigTotal = Number(aiConfigCountResult.rows[0]?.count || 0)

  if (aiConfigTotal === 0) {
    const now = new Date().toISOString()
    await connection.query(
      `
        INSERT INTO ai_runtime_config (
          id,
          model,
          request_timeout_ms,
          enable_cache,
          allow_manual_refresh,
          suggest_refresh_on_source_change,
          openai_store,
          updated_at,
          updated_by,
          updated_by_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        1,
        env.openaiModel,
        env.openaiTimeoutMs,
        true,
        true,
        true,
        env.openaiStore,
        now,
        0,
        'System Seed',
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
