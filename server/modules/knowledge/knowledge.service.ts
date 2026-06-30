import OpenAI from 'openai'
import { env } from '../../config/env.ts'
import type { AuthenticatedUser } from '../../types/auth.ts'
import type {
  CreateKnowledgeDocumentPayload,
  KnowledgeAskAttachment,
  KnowledgeAskPayload,
  KnowledgeAskResult,
  KnowledgeCitationItem,
  KnowledgeDocumentDetail,
  KnowledgeDocumentListItem,
  KnowledgeSessionDetail,
  KnowledgeSessionListItem,
  KnowledgeSessionMessageEntity,
  KnowledgeSessionMessageRuntime,
} from '../../types/knowledge.ts'
import { AppError } from '../../utils/appError.ts'
import { createAuditLog } from '../auditLog/auditLog.repository.ts'
import { getAiRuntimeConfigSnapshot } from '../ai-config/aiConfig.service.ts'
import {
  createKnowledgeDocumentRecord,
  createKnowledgeSessionMessageRecord,
  createKnowledgeSessionRecord,
  findKnowledgeDocumentById,
  findKnowledgeSessionById,
  listKnowledgeChunksByDocumentId,
  listKnowledgeChunksForSearch,
  listKnowledgeDocuments,
  listKnowledgeSessionMessages,
  listKnowledgeSessions,
  replaceKnowledgeChunks,
  updateKnowledgeSessionSnapshot,
} from './knowledge.repository.ts'

interface KnowledgeOperationContext {
  requestId: string
  authUser: AuthenticatedUser
}

interface SearchChunkCandidate {
  id: number
  sourceType: 'knowledge-document' | 'session-file'
  documentId: number | null
  chunkIndex: number
  content: string
  keywordSignature: string
  embedding: number[] | null
  charCount: number
  createdAt: string
  documentTitle: string
  fileName: string
}

let hasLoggedEmbeddingWarning = false

function createOpenAiClient(timeout: number) {
  return new OpenAI({
    apiKey: env.openaiApiKey,
    timeout,
    baseURL: env.openaiBaseUrl || undefined,
  })
}

// 判断 embedding 失败是否应该降级为关键词检索
function shouldFallbackForEmbeddingError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const status =
    'status' in error && typeof error.status === 'number'
      ? error.status
      : 'code' in error && typeof error.code === 'number'
        ? error.code
        : null
  const message =
    'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : ''
  const code = 'code' in error && typeof error.code === 'string' ? error.code.toLowerCase() : ''

  return (
    status === 400 ||
    status === 404 ||
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    code.includes('model') ||
    code.includes('timeout') ||
    message.includes('not supported') ||
    message.includes('unsupported') ||
    message.includes('not found') ||
    message.includes('no such model') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('network') ||
    message.includes('connection')
  )
}

// 只记录一次 embedding 降级告警，避免批量切块时刷满日志
function logEmbeddingFallbackWarning(error: unknown) {
  if (hasLoggedEmbeddingWarning) {
    return
  }

  hasLoggedEmbeddingWarning = true
  const message = error instanceof Error ? error.message : String(error)
  console.warn(
    `[knowledge] embedding unavailable, fallback to keyword retrieval. model=${env.openaiEmbeddingModel} reason=${message}`,
  )
}

// 调用 embedding 模型生成向量，失败时自动降级
async function createEmbeddingVector(input: string) {
  if (!env.openaiApiKey) {
    return null
  }

  try {
    const client = createOpenAiClient(env.openaiTimeoutMs)
    const result = await client.embeddings.create({
      model: env.openaiEmbeddingModel,
      input,
    })

    const embedding = result.data[0]?.embedding
    return Array.isArray(embedding) ? embedding : null
  } catch (error) {
    if (shouldFallbackForEmbeddingError(error)) {
      logEmbeddingFallbackWarning(error)
      return null
    }

    throw error
  }
}

// 统一清洗文本内容
function normalizeDocumentText(rawContent: string) {
  return rawContent
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

// 生成文档摘要
function buildDocumentSummary(content: string) {
  const normalized = normalizeDocumentText(content)

  if (!normalized) {
    return '暂无可用内容摘要'
  }

  return normalized.slice(0, 120)
}

// 生成会话名称，优先使用用户填写的标题
function buildSessionTitle(question: string, sessionTitle?: string) {
  const normalizedTitle = normalizeDocumentText(sessionTitle || '')
  if (normalizedTitle) {
    return normalizedTitle.slice(0, 120)
  }

  const normalizedQuestion = normalizeDocumentText(question)
  if (!normalizedQuestion) {
    return '未命名知识问答会话'
  }

  return normalizedQuestion.slice(0, 40)
}

// 按固定窗口切分文档，便于后续检索
function splitDocumentIntoChunks(content: string) {
  const normalized = normalizeDocumentText(content)
  const chunkSize = 600
  const overlapSize = 120
  const chunks: Array<{
    chunkIndex: number
    content: string
    keywordSignature: string
    charCount: number
  }> = []

  if (!normalized) {
    return chunks
  }

  let cursor = 0
  let chunkIndex = 0

  while (cursor < normalized.length) {
    const slice = normalized.slice(cursor, cursor + chunkSize).trim()

    if (slice) {
      chunks.push({
        chunkIndex,
        content: slice,
        keywordSignature: buildKeywordSignature(slice),
        charCount: slice.length,
      })
      chunkIndex += 1
    }

    if (cursor + chunkSize >= normalized.length) {
      break
    }

    cursor += chunkSize - overlapSize
  }

  return chunks
}

// 生成轻量关键词特征，用于兜底检索
function buildKeywordSignature(content: string) {
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ')
    .split(/\s+/)
    .filter((item) => item.length >= 2)

  const uniqueWords = Array.from(new Set(words))
  return uniqueWords.slice(0, 80).join(' ')
}

// 计算语义向量的余弦相似度
function calculateCosineSimilarity(left: number[], right: number[]) {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0
  }

  let dot = 0
  let leftNorm = 0
  let rightNorm = 0

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
    leftNorm += left[index] * left[index]
    rightNorm += right[index] * right[index]
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm))
}

// 将问题拆成检索 token
function tokenizeQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ')
    .split(/\s+/)
    .filter((item) => item.length >= 2)
}

// 使用关键词命中做兜底排序
function rankChunksByQuestion(question: string, chunks: SearchChunkCandidate[], topK: number) {
  const tokens = tokenizeQuestion(question)

  if (tokens.length === 0) {
    return chunks.slice(0, topK).map((chunk, index) => ({
      chunk,
      score: Math.max(0.1, 1 - index * 0.05),
    }))
  }

  return chunks
    .map((chunk) => {
      let hitCount = 0
      for (const token of tokens) {
        if (chunk.keywordSignature.includes(token) || chunk.content.toLowerCase().includes(token)) {
          hitCount += 1
        }
      }

      return {
        chunk,
        score: hitCount / tokens.length,
      }
    })
    .filter((item) => item.score > 0)
    .sort(
      (left, right) => right.score - left.score || left.chunk.chunkIndex - right.chunk.chunkIndex,
    )
    .slice(0, topK)
}

// 优先使用 embedding，缺失时回落到关键词检索
async function rankChunksByQuestionWithEmbedding(
  question: string,
  chunks: SearchChunkCandidate[],
  topK: number,
) {
  const questionEmbedding = await createEmbeddingVector(question)

  if (!questionEmbedding) {
    return rankChunksByQuestion(question, chunks, topK)
  }

  const keywordRanked = rankChunksByQuestion(question, chunks, Math.min(topK * 3, 20))
  const keywordScoreMap = new Map<number, number>()

  for (const item of keywordRanked) {
    keywordScoreMap.set(item.chunk.id, item.score)
  }

  return chunks
    .map((chunk) => {
      const semanticScore =
        chunk.embedding && chunk.embedding.length === questionEmbedding.length
          ? calculateCosineSimilarity(questionEmbedding, chunk.embedding)
          : 0
      const keywordScore = keywordScoreMap.get(chunk.id) ?? 0

      return {
        chunk,
        score: semanticScore * 0.75 + keywordScore * 0.25,
      }
    })
    .filter((item) => item.score > 0)
    .sort(
      (left, right) => right.score - left.score || left.chunk.chunkIndex - right.chunk.chunkIndex,
    )
    .slice(0, topK)
}

// 将命中片段压缩成 LLM 可用上下文
function buildKnowledgeContext(
  rankedChunks: Array<{
    chunk: SearchChunkCandidate
    score: number
  }>,
) {
  return rankedChunks
    .map(
      ({ chunk }, index) =>
        `【片段${index + 1}】文档：${chunk.documentTitle}；文件：${chunk.fileName}；片段序号：${chunk.chunkIndex}\n${chunk.content}`,
    )
    .join('\n\n')
}

// 构建前端展示用引用信息
function buildCitations(
  rankedChunks: Array<{
    chunk: SearchChunkCandidate
    score: number
  }>,
): KnowledgeCitationItem[] {
  return rankedChunks.map(({ chunk, score }) => ({
    sourceType: chunk.sourceType,
    documentId: chunk.documentId,
    documentTitle: chunk.documentTitle,
    fileName: chunk.fileName,
    chunkId: chunk.id,
    chunkIndex: chunk.chunkIndex,
    excerpt: chunk.content.slice(0, 160),
    score: Number(score.toFixed(3)),
  }))
}

// 将当前会话附件转成临时检索切块
async function buildAttachmentChunks(attachments: KnowledgeAskAttachment[] | undefined) {
  if (!attachments || attachments.length === 0) {
    return []
  }

  const chunkTasks = attachments.flatMap((attachment, attachmentIndex) => {
    const title = normalizeDocumentText(attachment.title) || `会话文件 ${attachmentIndex + 1}`
    const fileName = normalizeDocumentText(attachment.fileName) || `${title}.txt`
    const rawContent = normalizeDocumentText(attachment.rawContent)

    if (!rawContent) {
      return []
    }

    return splitDocumentIntoChunks(rawContent).map(async (chunk, chunkIndex) => ({
      id: -1 * (attachmentIndex * 1000 + chunkIndex + 1),
      sourceType: 'session-file' as const,
      documentId: null,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      keywordSignature: chunk.keywordSignature,
      embedding: await createEmbeddingVector(chunk.content),
      charCount: chunk.charCount,
      createdAt: new Date().toISOString(),
      documentTitle: title,
      fileName,
    }))
  })

  return Promise.all(chunkTasks)
}

// 将会话历史拼成多轮上下文
function buildConversationHistory(messages: KnowledgeSessionMessageEntity[]) {
  if (messages.length === 0) {
    return ''
  }

  const recentMessages = messages.slice(-6)

  return recentMessages
    .map((message, index) => {
      const roleLabel = message.role === 'user' ? '用户' : '助手'
      return `【历史${index + 1}】${roleLabel}：${message.content}`
    })
    .join('\n')
}

// 生成回答摘要
function buildAnswerSummary(answer: string) {
  return normalizeDocumentText(answer).slice(0, 120)
}

// 创建知识库文档并入库切块
export async function createKnowledgeDocument(
  payload: CreateKnowledgeDocumentPayload,
  context: KnowledgeOperationContext,
): Promise<KnowledgeDocumentDetail> {
  const title = payload.title.trim()
  const fileName = payload.fileName.trim()
  const rawContent = normalizeDocumentText(payload.rawContent)

  if (!title) {
    throw new AppError('知识库标题不能为空', 400)
  }

  if (!fileName) {
    throw new AppError('文件名不能为空', 400)
  }

  if (!rawContent) {
    throw new AppError('上传内容为空，无法写入知识库', 400)
  }

  const createdDocument = await createKnowledgeDocumentRecord({
    title,
    fileName,
    contentType: payload.contentType.trim() || 'text/plain',
    rawContent,
    summary: buildDocumentSummary(rawContent),
    status: 'processing',
    createdById: context.authUser.id,
    createdByName: context.authUser.name,
  })

  if (!createdDocument) {
    throw new AppError('新增知识库文档失败', 500)
  }

  const baseChunks = splitDocumentIntoChunks(rawContent)
  const chunks = await Promise.all(
    baseChunks.map(async (chunk) => ({
      ...chunk,
      embedding: await createEmbeddingVector(chunk.content),
    })),
  )
  await replaceKnowledgeChunks(createdDocument.id, chunks, 'ready')

  const detail = await getKnowledgeDocumentDetail(createdDocument.id)

  await createAuditLog({
    module: 'knowledgeBase',
    action: 'create',
    entityId: createdDocument.id,
    entityName: createdDocument.title,
    beforeData: undefined,
    afterData: {
      title: createdDocument.title,
      fileName: createdDocument.fileName,
      chunkCount: chunks.length,
    },
    operatorId: context.authUser.id,
    operatorName: context.authUser.name,
    requestId: context.requestId,
  })

  return detail
}

// 获取知识库文档列表
export async function getKnowledgeDocumentList(): Promise<KnowledgeDocumentListItem[]> {
  const documents = await listKnowledgeDocuments()

  return documents.map((document) => ({
    id: document.id,
    title: document.title,
    fileName: document.fileName,
    contentType: document.contentType,
    summary: document.summary,
    status: document.status,
    chunkCount: document.chunkCount,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    createdByName: document.createdByName,
  }))
}

// 获取单个知识库文档详情
export async function getKnowledgeDocumentDetail(
  documentId: number,
): Promise<KnowledgeDocumentDetail> {
  const document = await findKnowledgeDocumentById(documentId)

  if (!document) {
    throw new AppError('未找到指定的知识库文档', 404)
  }

  const chunks = await listKnowledgeChunksByDocumentId(documentId)

  return {
    id: document.id,
    title: document.title,
    fileName: document.fileName,
    contentType: document.contentType,
    rawContent: document.rawContent,
    summary: document.summary,
    status: document.status,
    chunkCount: document.chunkCount,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    createdByName: document.createdByName,
    chunks: chunks.map((chunk) => ({
      id: chunk.id,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      charCount: chunk.charCount,
    })),
  }
}

// 获取会话列表
export async function getKnowledgeSessionList(): Promise<KnowledgeSessionListItem[]> {
  const sessions = await listKnowledgeSessions()

  return sessions.map((session) => ({
    id: session.id,
    title: session.title,
    messageCount: session.messageCount,
    lastQuestion: session.lastQuestion,
    lastAnswerSummary: session.lastAnswerSummary,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  }))
}

// 获取会话详情和消息历史
export async function getKnowledgeSessionDetail(
  sessionId: number,
): Promise<KnowledgeSessionDetail> {
  const session = await findKnowledgeSessionById(sessionId)

  if (!session) {
    throw new AppError('未找到指定的知识问答会话', 404)
  }

  const messages = await listKnowledgeSessionMessages(sessionId)

  return {
    id: session.id,
    title: session.title,
    messageCount: session.messageCount,
    lastQuestion: session.lastQuestion,
    lastAnswerSummary: session.lastAnswerSummary,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      documentIds: message.documentIds,
      attachments: message.attachments,
      citations: message.citations,
      runtime: message.runtime,
      createdAt: message.createdAt,
    })),
  }
}

// 解析并确保目标会话存在
async function ensureKnowledgeSession(
  payload: KnowledgeAskPayload,
  context: KnowledgeOperationContext,
) {
  if (payload.sessionId) {
    const existingSession = await findKnowledgeSessionById(payload.sessionId)

    if (!existingSession) {
      throw new AppError('指定的知识问答会话不存在', 404)
    }

    return existingSession
  }

  const createdSession = await createKnowledgeSessionRecord({
    title: buildSessionTitle(payload.question, payload.sessionTitle),
    createdById: context.authUser.id,
    createdByName: context.authUser.name,
  })

  if (!createdSession) {
    throw new AppError('创建知识问答会话失败', 500)
  }

  await createAuditLog({
    module: 'knowledgeBase',
    action: 'create',
    entityId: createdSession.id,
    entityName: createdSession.title,
    beforeData: undefined,
    afterData: {
      type: 'knowledge-session',
      title: createdSession.title,
    },
    operatorId: context.authUser.id,
    operatorName: context.authUser.name,
    requestId: context.requestId,
  })

  return createdSession
}

// 持久化一轮用户问题和 AI 回答
async function persistKnowledgeConversationTurn(payload: {
  sessionId: number
  question: string
  answer: string
  documentIds: number[]
  attachments: KnowledgeAskAttachment[]
  citations: KnowledgeCitationItem[]
  runtime: KnowledgeSessionMessageRuntime
}) {
  await createKnowledgeSessionMessageRecord({
    sessionId: payload.sessionId,
    role: 'user',
    content: payload.question,
    documentIds: payload.documentIds,
    attachments: payload.attachments,
    citations: [],
    runtime: null,
  })

  await createKnowledgeSessionMessageRecord({
    sessionId: payload.sessionId,
    role: 'assistant',
    content: payload.answer,
    documentIds: payload.documentIds,
    attachments: payload.attachments,
    citations: payload.citations,
    runtime: payload.runtime,
  })

  const messages = await listKnowledgeSessionMessages(payload.sessionId)

  await updateKnowledgeSessionSnapshot({
    sessionId: payload.sessionId,
    messageCount: messages.length,
    lastQuestion: payload.question.slice(0, 500),
    lastAnswerSummary: buildAnswerSummary(payload.answer),
  })
}

// 基于知识库和会话历史执行问答，并持久化记录
export async function askKnowledgeQuestion(
  payload: KnowledgeAskPayload,
  context: KnowledgeOperationContext,
): Promise<KnowledgeAskResult> {
  const question = payload.question.trim()
  const topK = Math.min(Math.max(Number(payload.topK ?? 4), 1), 8)

  if (!question) {
    throw new AppError('问题不能为空', 400)
  }

  const session = await ensureKnowledgeSession(payload, context)
  const historyMessages = await listKnowledgeSessionMessages(session.id)
  const knowledgeChunks = (await listKnowledgeChunksForSearch(payload.documentIds)).map(
    (chunk) => ({
      ...chunk,
      sourceType: 'knowledge-document' as const,
    }),
  ) as SearchChunkCandidate[]
  const attachmentChunks = await buildAttachmentChunks(payload.attachments)
  const searchableChunks = [...knowledgeChunks, ...attachmentChunks]

  if (searchableChunks.length === 0) {
    throw new AppError('当前知识库中暂无可检索内容', 400)
  }

  const rankedChunks = await rankChunksByQuestionWithEmbedding(question, searchableChunks, topK)
  const citations = buildCitations(rankedChunks)

  if (rankedChunks.length === 0) {
    const runtime: KnowledgeSessionMessageRuntime = {
      provider: 'Rule Retrieval',
      model: env.openaiEmbeddingModel || 'local-keyword-search',
      degraded: true,
      retrievalStrategy: payload.attachments?.length
        ? 'embedding-fallback + session-file'
        : 'embedding-fallback',
    }
    const answer = '当前知识库中没有检索到足够相关的内容，建议换一个问法或先补充文档。'

    await persistKnowledgeConversationTurn({
      sessionId: session.id,
      question,
      answer,
      documentIds: payload.documentIds ?? [],
      attachments: payload.attachments ?? [],
      citations: [],
      runtime,
    })

    return {
      sessionId: session.id,
      sessionTitle: session.title,
      answer,
      citations: [],
      matchedCount: 0,
      runtime,
    }
  }

  const runtimeConfig = await getAiRuntimeConfigSnapshot()
  const contextText = buildKnowledgeContext(rankedChunks)
  const conversationHistory = buildConversationHistory(historyMessages)

  if (!runtimeConfig.apiKeyConfigured) {
    const runtime: KnowledgeSessionMessageRuntime = {
      provider: 'Rule Retrieval',
      model: env.openaiEmbeddingModel || 'local-keyword-search',
      degraded: true,
      retrievalStrategy: payload.attachments?.length
        ? 'embedding + keyword fallback + session-file'
        : 'embedding + keyword fallback',
    }
    const answer = [
      '当前未配置大模型密钥，系统已返回基于知识片段的本地检索结果。',
      '你可以先查看下面引用的片段，并根据文档原文继续判断。',
    ].join(' ')

    await persistKnowledgeConversationTurn({
      sessionId: session.id,
      question,
      answer,
      documentIds: payload.documentIds ?? [],
      attachments: payload.attachments ?? [],
      citations,
      runtime,
    })

    return {
      sessionId: session.id,
      sessionTitle: session.title,
      answer,
      citations,
      matchedCount: rankedChunks.length,
      runtime,
    }
  }

  const client = createOpenAiClient(runtimeConfig.requestTimeoutMs)
  const response = await client.responses.create({
    model: runtimeConfig.model,
    store: runtimeConfig.openaiStore,
    instructions: [
      '你是企业内部知识库问答助手',
      '只能基于给出的知识库片段回答',
      '如果知识片段不足以支撑结论，请明确说明不知道或信息不足',
      '回答使用中文，语气专业，尽量给出条理清晰的结论',
      '不要编造文档中没有出现的制度、流程或数字',
    ].join(' '),
    input: [
      conversationHistory ? `历史对话：\n${conversationHistory}` : '',
      `用户问题：${question}`,
      `知识库片段：\n${contextText}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
    text: {
      format: {
        type: 'text',
      },
    },
    max_output_tokens: 900,
  })

  const answer = response.output_text.trim()

  if (!answer) {
    throw new AppError('知识库问答返回内容为空', 502, 'AI_EMPTY_OUTPUT')
  }

  const runtime: KnowledgeSessionMessageRuntime = {
    provider: 'OpenAI Compatible',
    model: runtimeConfig.model,
    degraded: false,
    retrievalStrategy: payload.attachments?.length
      ? 'embedding + keyword + session-file + llm-answer'
      : 'embedding + keyword + llm-answer',
  }

  await persistKnowledgeConversationTurn({
    sessionId: session.id,
    question,
    answer,
    documentIds: payload.documentIds ?? [],
    attachments: payload.attachments ?? [],
    citations,
    runtime,
  })

  return {
    sessionId: session.id,
    sessionTitle: session.title,
    answer,
    citations,
    matchedCount: rankedChunks.length,
    runtime,
  }
}
