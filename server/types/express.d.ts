declare module 'express' {
  export interface Request {
    body: unknown
    query: Record<string, string | undefined>
    params: Record<string, string>
    headers: Record<string, string | string[] | undefined>
    method: string
    originalUrl: string
    requestId?: string
    requestStartedAt?: number
    validatedBody?: unknown
    authUser?: import('./auth').AuthenticatedUser
    is(type: string): boolean
    [key: string]: unknown
  }

  export interface Response {
    status(code: number): this
    statusCode: number
    json(body: unknown): this
    setHeader(name: string, value: string): void
    on(event: 'finish', listener: () => void): this
  }

  export interface NextFunction {
    (error?: unknown): void
  }

  export type RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => unknown | Promise<unknown>

  export interface Router {
    use(...handlers: unknown[]): Router
    use(path: string, ...handlers: unknown[]): Router
    get(path: string, ...handlers: RequestHandler[]): Router
    post(path: string, ...handlers: RequestHandler[]): Router
    put(path: string, ...handlers: RequestHandler[]): Router
    delete(path: string, ...handlers: RequestHandler[]): Router
  }

  export interface Application extends Router {
    listen(port: number, callback?: () => void): unknown
  }

  interface ExpressFactory {
    (): Application
    json(options?: { limit?: string }): RequestHandler
    urlencoded(options?: { extended?: boolean }): RequestHandler
  }

  export function Router(): Router

  const express: ExpressFactory
  export default express
}
