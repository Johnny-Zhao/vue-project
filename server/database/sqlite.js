import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { env } from '../config/env.js'

let database = null

function seedTutorialTasks(db) {
  const row = db.prepare('SELECT COUNT(*) AS count FROM tutorial_tasks').get()
  const total = Number(row?.count || 0)

  if (total > 0) {
    return
  }

  const insert = db.prepare(`
    INSERT INTO tutorial_tasks (title, status, priority, assignee, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const now = new Date().toISOString()

  insert.run(
    '梳理 Express 请求链路',
    'doing',
    'high',
    'Backend',
    '从路由、控制器、服务到 SQLite 仓储层走通一次。',
    now,
    now,
  )
  insert.run(
    '补充请求日志中间件',
    'todo',
    'medium',
    'Node',
    '让每个请求都能看到 requestId、状态码和耗时。',
    now,
    now,
  )
  insert.run(
    '做一个前端 CRUD 演示页',
    'done',
    'medium',
    'Frontend',
    '页面支持新增、编辑、删除和筛选，直接联调 Express 接口。',
    now,
    now,
  )
}

function createDatabase() {
  fs.mkdirSync(path.dirname(env.sqliteDbPath), { recursive: true })

  const db = new Database(env.sqliteDbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS tutorial_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      assignee TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  seedTutorialTasks(db)
  return db
}

export function getDatabase() {
  if (!database) {
    database = createDatabase()
  }

  return database
}
