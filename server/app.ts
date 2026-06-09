import express from 'express'
import { errorHandler } from './middleware/errorHandler.ts'
import { notFoundHandler } from './middleware/notFoundHandler.ts'
import { requestContext } from './middleware/requestContext.ts'
import { requestLogger } from './middleware/requestLogger.ts'
import { apiRouter } from './routes/index.ts'

export function createServer() {
  const app = express()

  app.use(requestContext)
  app.use(requestLogger)
  app.use(express.json({ limit: '256kb' }))
  app.use(express.urlencoded({ extended: false }))
  app.use('/api', apiRouter)
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
