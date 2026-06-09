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
  sqliteDbPath: string
  openaiApiKey: string
  openaiModel: string
  openaiTimeoutMs: number
  openaiStore: boolean
}

export const env: ServerEnv = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  sqliteDbPath: process.env.SQLITE_DB_PATH || path.join(serverRoot, 'data', 'tutorial.sqlite'),
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-5.4',
  openaiTimeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 30000),
  openaiStore: process.env.OPENAI_STORE === 'true',
}
