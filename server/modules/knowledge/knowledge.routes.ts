import { Router } from 'express'
import { authorize, requireAuth } from '../../middleware/auth.ts'
import { requireJsonContent } from '../../middleware/requireJsonContent.ts'
import {
  getKnowledgeDocument,
  getKnowledgeDocuments,
  getKnowledgeSession,
  getKnowledgeSessions,
  postKnowledgeAsk,
  postKnowledgeDocument,
} from './knowledge.controller.ts'

export const knowledgeRouter = Router()

knowledgeRouter.use(requireAuth)

knowledgeRouter.get('/documents', getKnowledgeDocuments)
knowledgeRouter.get('/documents/:id', getKnowledgeDocument)
knowledgeRouter.get('/sessions', getKnowledgeSessions)
knowledgeRouter.get('/sessions/:id', getKnowledgeSession)
knowledgeRouter.post(
  '/documents',
  authorize({ roles: ['admin'], permissions: ['knowledge:manage'] }),
  requireJsonContent,
  postKnowledgeDocument,
)
knowledgeRouter.post('/ask', requireJsonContent, postKnowledgeAsk)
