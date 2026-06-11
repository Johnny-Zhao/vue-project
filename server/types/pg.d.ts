declare module 'pg' {
  export interface QueryResultRow {
    [column: string]: unknown
  }

  export interface QueryResult<TRow = QueryResultRow> {
    rows: TRow[]
    rowCount: number | null
  }

  export interface PoolConfig {
    host?: string
    port?: number
    database?: string
    user?: string
    password?: string
    ssl?: boolean | Record<string, unknown>
  }

  export class Pool {
    constructor(config?: PoolConfig)
    query<TRow = QueryResultRow>(
      text: string,
      values?: readonly unknown[],
    ): Promise<QueryResult<TRow>>
    end(): Promise<void>
  }
}
