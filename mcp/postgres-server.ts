import { Pool } from 'pg'
import * as z from 'zod/v4'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { env } from '../server/config/env.ts'

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
const READONLY_START_RE = /^(select|with|explain|show)\b/i
const FORBIDDEN_SQL_RE =
  /\b(insert|update|delete|alter|drop|truncate|create|grant|revoke|copy|comment|vacuum|analyze|cluster|reindex|refresh|call|do|set|reset|discard|merge)\b/i

const pool = new Pool({
  host: env.postgresHost,
  port: env.postgresPort,
  database: env.postgresDatabase,
  user: env.postgresUser,
  password: env.postgresPassword,
  ssl: env.postgresSsl ? { rejectUnauthorized: false } : false,
})

function assertIdentifier(value: string, label: string) {
  if (!IDENTIFIER_RE.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`)
  }
}

function normalizeReadonlySql(sql: string) {
  const normalized = sql.trim().replace(/;+$/g, '').trim()

  if (!normalized) {
    throw new Error('SQL must not be empty.')
  }

  if (normalized.includes(';')) {
    throw new Error('Only one readonly SQL statement is allowed.')
  }

  if (!READONLY_START_RE.test(normalized)) {
    throw new Error('Only SELECT / WITH / EXPLAIN / SHOW statements are allowed.')
  }

  if (FORBIDDEN_SQL_RE.test(normalized)) {
    throw new Error('Potential write operation detected. Query rejected.')
  }

  return normalized
}

async function listSchemas() {
  const result = await pool.query<{ schema_name: string }>(
    `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schema_name;
    `,
  )

  return result.rows.map((row) => row.schema_name)
}

async function listTables(schema: string) {
  assertIdentifier(schema, 'schema')

  const result = await pool.query<{ table_name: string }>(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `,
    [schema],
  )

  return result.rows.map((row) => row.table_name)
}

async function describeTable(schema: string, tableName: string) {
  assertIdentifier(schema, 'schema')
  assertIdentifier(tableName, 'tableName')

  const columnsResult = await pool.query<{
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string | null
  }>(
    `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = $2
      ORDER BY ordinal_position;
    `,
    [schema, tableName],
  )

  const primaryKeyResult = await pool.query<{ column_name: string }>(
    `
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
      ORDER BY kcu.ordinal_position;
    `,
    [schema, tableName],
  )

  if (columnsResult.rows.length === 0) {
    throw new Error(`Table not found: ${schema}.${tableName}`)
  }

  const primaryKeys = new Set(primaryKeyResult.rows.map((row) => row.column_name))

  return {
    schema,
    tableName,
    columns: columnsResult.rows.map((row) => ({
      name: row.column_name,
      dataType: row.data_type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      primaryKey: primaryKeys.has(row.column_name),
    })),
  }
}

async function runReadonlyQuery(sql: string, maxRows: number) {
  const normalizedSql = normalizeReadonlySql(sql)
  const client = await pool.connect()

  try {
    await client.query('BEGIN READ ONLY')
    await client.query('SET LOCAL statement_timeout = 10000')

    const result = await client.query(normalizedSql)
    await client.query('COMMIT')

    const rows = result.rows.slice(0, maxRows)

    return {
      rowCount: result.rowCount ?? rows.length,
      truncated: result.rows.length > rows.length,
      fields: result.fields.map((field: { name: string }) => field.name),
      rows,
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

const server = new McpServer({
  name: 'local-postgres',
  version: '1.0.0',
})

server.registerTool(
  'list_schemas',
  {
    description: '列出当前 PostgreSQL 实例中可访问的 schema。',
    description: 'List schemas accessible in the current PostgreSQL instance.',
    annotations: {
      title: 'List Schemas',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    const schemas = await listSchemas()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ schemas }, null, 2),
        },
      ],
      structuredContent: { schemas },
    }
  },
)

server.registerTool(
  'list_tables',
  {
    description: 'List tables in a schema.',
    inputSchema: {
      schema: z
        .string()
        .optional()
        .describe('Schema name. Defaults to POSTGRES_SCHEMA from server/.env.'),
    },
    annotations: {
      title: 'List Tables',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ schema }) => {
    const resolvedSchema = schema ?? env.postgresSchema
    const tables = await listTables(resolvedSchema)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ schema: resolvedSchema, tables }, null, 2),
        },
      ],
      structuredContent: { schema: resolvedSchema, tables },
    }
  },
)

server.registerTool(
  'describe_table',
  {
    description: 'Describe table columns, nullability, defaults, and primary keys.',
    inputSchema: {
      tableName: z.string().describe('Table name'),
      schema: z
        .string()
        .optional()
        .describe('Schema name. Defaults to POSTGRES_SCHEMA from server/.env.'),
    },
    annotations: {
      title: 'Describe Table',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ tableName, schema }) => {
    const resolvedSchema = schema ?? env.postgresSchema
    const table = await describeTable(resolvedSchema, tableName)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(table, null, 2),
        },
      ],
      structuredContent: table,
    }
  },
)

server.registerTool(
  'query_readonly',
  {
    description:
      'Run a readonly SQL statement. Only single SELECT / WITH / EXPLAIN / SHOW statements are allowed.',
    inputSchema: {
      sql: z.string().min(1).describe('Readonly SQL to execute'),
      maxRows: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe('Maximum rows to return. Defaults to 100.'),
    },
    annotations: {
      title: 'Readonly Query',
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ sql, maxRows }) => {
    const result = await runReadonlyQuery(sql, maxRows ?? 100)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
      structuredContent: result,
    }
  },
)

async function testConnection() {
  const result = await pool.query<{
    current_database: string
    current_schema: string
    version: string
  }>(
    `
      SELECT
        current_database() AS current_database,
        current_schema() AS current_schema,
        version() AS version;
    `,
  )

  console.log(JSON.stringify(result.rows[0] ?? null, null, 2))
}

function printHelp() {
  console.log(`local-postgres MCP server

Usage:
  node --import jiti/register mcp/postgres-server.ts
  node --import jiti/register mcp/postgres-server.ts --test-connection

Notes:
  - Starts as an MCP stdio server by default
  - Reads database connection settings from server/.env
  - Exposes readonly tools only
`)
}

async function main() {
  if (process.argv.includes('--help')) {
    printHelp()
    return
  }

  if (process.argv.includes('--test-connection')) {
    await testConnection()
    await pool.end()
    return
  }

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error(
    `[local-postgres] MCP server started for ${env.postgresUser}@${env.postgresHost}:${env.postgresPort}/${env.postgresDatabase}`,
  )
}

process.on('SIGINT', () => {
  void pool.end()
})

process.on('SIGTERM', () => {
  void pool.end()
})

main().catch(async (error) => {
  console.error('[local-postgres] server error:', error)
  await pool.end().catch(() => undefined)
  process.exit(1)
})
