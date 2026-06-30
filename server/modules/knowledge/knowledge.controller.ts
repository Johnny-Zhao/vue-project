import type { RequestHandler } from 'express'
import type { CreateKnowledgeDocumentPayload, KnowledgeAskPayload } from '../../types/knowledge.ts'
import { createSuccessResponse } from '../../utils/apiResponse.ts'
import { AppError } from '../../utils/appError.ts'
import {
  askKnowledgeQuestion,
  createKnowledgeDocument,
  getKnowledgeDocumentDetail,
  getKnowledgeDocumentList,
  getKnowledgeSessionDetail,
  getKnowledgeSessionList,
} from './knowledge.service.ts'

function requireAuthContext(req: Parameters<RequestHandler>[0]) {
  if (!req.authUser) {
    throw new AppError('未登录或登录已过期', 401)
  }

  return {
    requestId: req.requestId || 'knowledge-request',
    authUser: req.authUser,
  }
}

// 杩斿洖鐭ヨ瘑搴撴枃妗ｅ垪琛?
export const getKnowledgeDocuments: RequestHandler = async (_req, res) => {
  const data = await getKnowledgeDocumentList()
  res.json(createSuccessResponse(data, '已返回知识库文档列表'))
}

// 杩斿洖鍗曚釜鐭ヨ瘑搴撴枃妗ｈ鎯?
export const getKnowledgeDocument: RequestHandler = async (req, res) => {
  const documentId = Number(req.params.id)

  if (!Number.isInteger(documentId) || documentId <= 0) {
    throw new AppError('知识库文档 id 不合法', 400)
  }

  const data = await getKnowledgeDocumentDetail(documentId)
  res.json(createSuccessResponse(data, '已返回知识库文档详情'))
}

// 鏂板涓€浠界煡璇嗗簱鏂囨。
export const postKnowledgeDocument: RequestHandler = async (req, res) => {
  const data = await createKnowledgeDocument(
    req.body as CreateKnowledgeDocumentPayload,
    requireAuthContext(req),
  )
  res.status(201).json(createSuccessResponse(data, '知识库文档上传成功', 201))
}

// 杩斿洖闂瓟浼氳瘽鍒楄〃
export const getKnowledgeSessions: RequestHandler = async (_req, res) => {
  const data = await getKnowledgeSessionList()
  res.json(createSuccessResponse(data, '已返回知识问答会话列表'))
}

// 杩斿洖鍗曚釜闂瓟浼氳瘽璇︽儏
export const getKnowledgeSession: RequestHandler = async (req, res) => {
  const sessionId = Number(req.params.id)

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    throw new AppError('知识问答会话 id 不合法', 400)
  }

  const data = await getKnowledgeSessionDetail(sessionId)
  res.json(createSuccessResponse(data, '已返回知识问答会话详情'))
}

// 鎵ц鍩轰簬鐭ヨ瘑搴撶殑闂瓟锛屽苟鎸佷箙鍖栧埌浼氳瘽
export const postKnowledgeAsk: RequestHandler = async (req, res) => {
  const data = await askKnowledgeQuestion(req.body as KnowledgeAskPayload, requireAuthContext(req))
  res.json(createSuccessResponse(data, '知识库问答成功'))
}
