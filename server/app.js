import express from 'express'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFoundHandler } from './middleware/notFoundHandler.js'
import { requestContext } from './middleware/requestContext.js'
import { requestLogger } from './middleware/requestLogger.js'

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
