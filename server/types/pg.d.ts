declare module 'pg' {
  export interface QueryResultRow {
    [column: string]: unknown
  }

  export interface FieldDef {
    name: string
  }

  export interface QueryResult<TRow = QueryResultRow> {
    rows: TRow[]
    rowCount: number | null
    fields: FieldDef[]
  }

  export interface PoolConfig {
    host?: string
    port?: number
    database?: string
    user?: string
    password?: string
    ssl?: boolean | Record<string, unknown>
  }

  export interface PoolClient {
    query<TRow = QueryResultRow>(
      text: string,
      values?: readonly unknown[],
    ): Promise<QueryResult<TRow>>
    release(): void
  }

  export class Pool {
    constructor(config?: PoolConfig)
    query<TRow = QueryResultRow>(
      text: string,
      values?: readonly unknown[],
    ): Promise<QueryResult<TRow>>
    connect(): Promise<PoolClient>
    end(): Promise<void>
  }
}
