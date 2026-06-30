export type KnowledgeDocumentStatus = 'processing' | 'ready' | 'failed'
export type KnowledgeMessageRole = 'user' | 'assistant'

export interface KnowledgeDocumentEntity {
  id: number
  title: string
  fileName: string
  contentType: string
  rawContent: string
  summary: string
  status: KnowledgeDocumentStatus
  chunkCount: number
  createdAt: string
  updatedAt: string
  createdById: number
  createdByName: string
}

export interface KnowledgeDocumentRow {
  id: number | string
  title: string
  fileName: string
  contentType: string
  rawContent: string
  summary: string
  status: KnowledgeDocumentStatus
  chunkCount: number | string
  createdAt: string
  updatedAt: string
  createdById: number | string
  createdByName: string
}

export interface KnowledgeChunkEntity {
  id: number
  documentId: number
  chunkIndex: number
  content: string
  keywordSignature: string
  embedding: number[] | null
  charCount: number
  createdAt: string
}

export interface KnowledgeChunkRow {
  id: number | string
  documentId: number | string
  chunkIndex: number | string
  content: string
  keywordSignature: string
  embedding?: unknown
  charCount: number | string
  createdAt: string
}

export interface KnowledgeSessionEntity {
  id: number
  title: string
  messageCount: number
  lastQuestion: string
  lastAnswerSummary: string
  createdAt: string
  updatedAt: string
  createdById: number
  createdByName: string
}

export interface KnowledgeSessionRow {
  id: number | string
  title: string
  messageCount: number | string
  lastQuestion: string
  lastAnswerSummary: string
  createdAt: string
  updatedAt: string
  createdById: number | string
  createdByName: string
}

export interface KnowledgeSessionMessageRuntime {
  provider: string
  model: string
  degraded: boolean
  retrievalStrategy: string
}

export interface KnowledgeSessionMessageEntity {
  id: number
  sessionId: number
  role: KnowledgeMessageRole
  content: string
  documentIds: number[]
  attachments: KnowledgeAskAttachment[]
  citations: KnowledgeCitationItem[]
  runtime: KnowledgeSessionMessageRuntime | null
  createdAt: string
}

export interface KnowledgeSessionMessageRow {
  id: number | string
  sessionId: number | string
  role: KnowledgeMessageRole
  content: string
  documentIds?: unknown
  attachments?: unknown
  citations?: unknown
  runtime?: unknown
  createdAt: string
}

export interface CreateKnowledgeDocumentPayload {
  title: string
  fileName: string
  contentType: string
  rawContent: string
}

export interface KnowledgeDocumentListItem {
  id: number
  title: string
  fileName: string
  contentType: string
  summary: string
  status: KnowledgeDocumentStatus
  chunkCount: number
  createdAt: string
  updatedAt: string
  createdByName: string
}

export interface KnowledgeDocumentChunkItem {
  id: number
  chunkIndex: number
  content: string
  charCount: number
}

export interface KnowledgeDocumentDetail extends KnowledgeDocumentListItem {
  rawContent: string
  chunks: KnowledgeDocumentChunkItem[]
}

export interface KnowledgeCitationItem {
  sourceType: 'knowledge-document' | 'session-file'
  documentId: number | null
  documentTitle: string
  fileName: string
  chunkId: number
  chunkIndex: number
  excerpt: string
  score: number
}

export interface KnowledgeAskAttachment {
  title: string
  fileName: string
  contentType: string
  rawContent: string
}

export interface KnowledgeAskPayload {
  question: string
  topK?: number
  documentIds?: number[]
  attachments?: KnowledgeAskAttachment[]
  sessionId?: number
  sessionTitle?: string
}

export interface KnowledgeAskResult {
  sessionId: number
  sessionTitle: string
  answer: string
  citations: KnowledgeCitationItem[]
  matchedCount: number
  runtime: KnowledgeSessionMessageRuntime
}

export interface KnowledgeSessionListItem {
  id: number
  title: string
  messageCount: number
  lastQuestion: string
  lastAnswerSummary: string
  createdAt: string
  updatedAt: string
}

export interface KnowledgeSessionMessageItem {
  id: number
  role: KnowledgeMessageRole
  content: string
  documentIds: number[]
  attachments: KnowledgeAskAttachment[]
  citations: KnowledgeCitationItem[]
  runtime: KnowledgeSessionMessageRuntime | null
  createdAt: string
}

export interface KnowledgeSessionDetail extends KnowledgeSessionListItem {
  messages: KnowledgeSessionMessageItem[]
}
