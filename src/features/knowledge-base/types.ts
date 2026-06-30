export type KnowledgeDocumentStatus = 'processing' | 'ready' | 'failed'
export type KnowledgeMessageRole = 'user' | 'assistant'

export interface KnowledgeDocumentItem {
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

export interface KnowledgeDocumentDetail extends KnowledgeDocumentItem {
  rawContent: string
  chunks: KnowledgeDocumentChunkItem[]
}

export interface CreateKnowledgeDocumentPayload {
  title: string
  fileName: string
  contentType: string
  rawContent: string
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

export interface KnowledgeSessionMessageRuntime {
  provider: string
  model: string
  degraded: boolean
  retrievalStrategy: string
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

export interface KnowledgeSessionItem {
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

export interface KnowledgeSessionDetail extends KnowledgeSessionItem {
  messages: KnowledgeSessionMessageItem[]
}
