declare module 'better-sqlite3' {
  export interface DatabaseOptions {
    nativeBinding?: string | object
    readonly?: boolean
    fileMustExist?: boolean
    timeout?: number
    verbose?: ((message?: unknown, ...optionalParams: unknown[]) => void) | null
  }

  export interface RunResult {
    changes: number
    lastInsertRowid: number | bigint
  }

  export interface Statement<TRow = Record<string, unknown>> {
    get(...params: unknown[]): TRow
    all(...params: unknown[]): TRow[]
    run(...params: unknown[]): RunResult
  }

  export default class Database {
    constructor(filename: string, options?: DatabaseOptions)
    pragma(command: string): unknown
    exec(sql: string): this
    prepare<TRow = Record<string, unknown>>(sql: string): Statement<TRow>
  }
}
