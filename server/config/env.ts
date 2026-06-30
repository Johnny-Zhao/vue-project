import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverRoot = path.resolve(__dirname, '..')

dotenv.config({
  path: path.join(serverRoot, '.env'),
})

export interface ServerEnv {
  nodeEnv: string
  port: number
  authJwtSecret: string
  authJwtExpiresMinutes: number
  sqliteDbPath: string
  postgresHost: string
  postgresPort: number
  postgresDatabase: string
  postgresUser: string
  postgresPassword: string
  postgresSchema: string
  postgresSsl: boolean
  openaiApiKey: string
  openaiBaseUrl: string
  openaiModel: string
  openaiEmbeddingModel: string
  openaiTimeoutMs: number
  openaiStore: boolean
}

export const env: ServerEnv = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  authJwtSecret: process.env.AUTH_JWT_SECRET || 'dev-only-jwt-secret-change-me',
  authJwtExpiresMinutes: Number(process.env.AUTH_JWT_EXPIRES_MINUTES || 30),
  sqliteDbPath: process.env.SQLITE_DB_PATH || path.join(serverRoot, 'data', 'tutorial.sqlite'),
  postgresHost: process.env.POSTGRES_HOST || '127.0.0.1',
  postgresPort: Number(process.env.POSTGRES_PORT || 5432),
  postgresDatabase: process.env.POSTGRES_DB || 'vue_project',
  postgresUser: process.env.POSTGRES_USER || 'postgres',
  postgresPassword: process.env.POSTGRES_PASSWORD || '',
  postgresSchema: process.env.POSTGRES_SCHEMA || 'public',
  postgresSsl: process.env.POSTGRES_SSL === 'true',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-5.4',
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  openaiTimeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 30000),
  openaiStore: process.env.OPENAI_STORE === 'true',
}
