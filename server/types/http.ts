import type { NextFunction, Request, Response } from 'express'

export interface ApiSuccessResponse<T> {
  code: number
  message: string
  data: T
  succeed: true
}

export interface ApiFailureResponse {
  code: number
  message: string
  data: null
  succeed: false
  errorCode?: string
}

export type ServerRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => unknown | Promise<unknown>

export type ServerErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => unknown | Promise<unknown>

export type BodyValidationResult<T> =
  | {
      valid: true
      data: T
    }
  | {
      valid: false
      error: Error
    }

export type MessageValidationResult<T> =
  | {
      valid: true
      data: T
    }
  | {
      valid: false
      message: string
    }
