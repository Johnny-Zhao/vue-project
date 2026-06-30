import { getPostgresPool } from '../../pg/database/postgres.ts'
import type {
  KnowledgeAskAttachment,
  KnowledgeChunkEntity,
  KnowledgeChunkRow,
  KnowledgeCitationItem,
  KnowledgeDocumentEntity,
  KnowledgeDocumentRow,
  KnowledgeSessionEntity,
  KnowledgeSessionMessageEntity,
  KnowledgeSessionMessageRow,
  KnowledgeSessionMessageRuntime,
  KnowledgeSessionRow,
} from '../../types/knowledge.ts'

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number')
}

function isAttachmentArray(value: unknown): value is KnowledgeAskAttachment[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        !!item &&
        typeof item === 'object' &&
        'title' in item &&
        'fileName' in item &&
        'contentType' in item &&
        'rawContent' in item,
    )
  )
}

function isCitationArray(value: unknown): value is KnowledgeCitationItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        !!item &&
        typeof item === 'object' &&
        'sourceType' in item &&
        'documentTitle' in item &&
        'fileName' in item &&
        'chunkId' in item,
    )
  )
}

function isRuntimeObject(value: unknown): value is KnowledgeSessionMessageRuntime {
  return (
    !!value &&
    typeof value === 'object' &&
    'provider' in value &&
    'model' in value &&
    'degraded' in value &&
    'retrievalStrategy' in value
  )
}

function mapKnowledgeDocumentRow(row: KnowledgeDocumentRow): KnowledgeDocumentEntity {
  return {
    id: Number(row.id),
    title: row.title,
    fileName: row.fileName,
    contentType: row.contentType,
    rawContent: row.rawContent,
    summary: row.summary,
    status: row.status,
    chunkCount: Number(row.chunkCount),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdById: Number(row.createdById),
    createdByName: row.createdByName,
  }
}

function mapKnowledgeChunkRow(row: KnowledgeChunkRow): KnowledgeChunkEntity {
  return {
    id: Number(row.id),
    documentId: Number(row.documentId),
    chunkIndex: Number(row.chunkIndex),
    content: row.content,
    keywordSignature: row.keywordSignature,
    embedding: Array.isArray(row.embedding)
      ? row.embedding.filter((value): value is number => typeof value === 'number')
      : null,
    charCount: Number(row.charCount),
    createdAt: row.createdAt,
  }
}

function mapKnowledgeSessionRow(row: KnowledgeSessionRow): KnowledgeSessionEntity {
  return {
    id: Number(row.id),
    title: row.title,
    messageCount: Number(row.messageCount),
    lastQuestion: row.lastQuestion,
    lastAnswerSummary: row.lastAnswerSummary,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdById: Number(row.createdById),
    createdByName: row.createdByName,
  }
}

function mapKnowledgeSessionMessageRow(
  row: KnowledgeSessionMessageRow,
): KnowledgeSessionMessageEntity {
  return {
    id: Number(row.id),
    sessionId: Number(row.sessionId),
    role: row.role,
    content: row.content,
    documentIds: isNumberArray(row.documentIds) ? row.documentIds : [],
    attachments: isAttachmentArray(row.attachments) ? row.attachments : [],
    citations: isCitationArray(row.citations) ? row.citations : [],
    runtime: isRuntimeObject(row.runtime) ? row.runtime : null,
    createdAt: row.createdAt,
  }
}

// 读取知识库文档列表
export async function listKnowledgeDocuments() {
  const pool = await getPostgresPool()
  const result = await pool.query<KnowledgeDocumentRow>(
    `
      SELECT
        id,
        title,
        file_name AS "fileName",
        content_type AS "contentType",
        raw_content AS "rawContent",
        summary,
        status,
        chunk_count AS "chunkCount",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        created_by_id AS "createdById",
        created_by_name AS "createdByName"
      FROM knowledge_documents
      ORDER BY updated_at DESC, id DESC
    `,
  )

  return result.rows.map(mapKnowledgeDocumentRow)
}

// 按 id 读取单个知识库文档
export async function findKnowledgeDocumentById(id: number) {
  const pool = await getPostgresPool()
  const result = await pool.query<KnowledgeDocumentRow>(
    `
      SELECT
        id,
        title,
        file_name AS "fileName",
        content_type AS "contentType",
        raw_content AS "rawContent",
        summary,
        status,
        chunk_count AS "chunkCount",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        created_by_id AS "createdById",
        created_by_name AS "createdByName"
      FROM knowledge_documents
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  )

  return result.rows[0] ? mapKnowledgeDocumentRow(result.rows[0]) : null
}

// 新增知识库文档主记录
export async function createKnowledgeDocumentRecord(payload: {
  title: string
  fileName: string
  contentType: string
  rawContent: string
  summary: string
  status: KnowledgeDocumentEntity['status']
  createdById: number
  createdByName: string
}) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()
  const result = await pool.query<KnowledgeDocumentRow>(
    `
      INSERT INTO knowledge_documents (
        title,
        file_name,
        content_type,
        raw_content,
        summary,
        status,
        chunk_count,
        created_at,
        updated_at,
        created_by_id,
        created_by_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, $10)
      RETURNING
        id,
        title,
        file_name AS "fileName",
        content_type AS "contentType",
        raw_content AS "rawContent",
        summary,
        status,
        chunk_count AS "chunkCount",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        created_by_id AS "createdById",
        created_by_name AS "createdByName"
    `,
    [
      payload.title,
      payload.fileName,
      payload.contentType,
      payload.rawContent,
      payload.summary,
      payload.status,
      now,
      now,
      payload.createdById,
      payload.createdByName,
    ],
  )

  return result.rows[0] ? mapKnowledgeDocumentRow(result.rows[0]) : null
}

// 覆盖文档切块并同步状态
export async function replaceKnowledgeChunks(
  documentId: number,
  chunks: Array<{
    chunkIndex: number
    content: string
    keywordSignature: string
    embedding: number[] | null
    charCount: number
  }>,
  status: KnowledgeDocumentEntity['status'],
) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()

  await pool.query('DELETE FROM knowledge_document_chunks WHERE document_id = $1', [documentId])

  for (const chunk of chunks) {
    await pool.query(
      `
        INSERT INTO knowledge_document_chunks (
          document_id,
          chunk_index,
          content,
          keyword_signature,
          embedding_json,
          char_count,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        documentId,
        chunk.chunkIndex,
        chunk.content,
        chunk.keywordSignature,
        chunk.embedding ? JSON.stringify(chunk.embedding) : null,
        chunk.charCount,
        now,
      ],
    )
  }

  await pool.query(
    `
      UPDATE knowledge_documents
      SET
        status = $2,
        chunk_count = $3,
        updated_at = $4
      WHERE id = $1
    `,
    [documentId, status, chunks.length, now],
  )
}

// 读取某个文档下的全部切块
export async function listKnowledgeChunksByDocumentId(documentId: number) {
  const pool = await getPostgresPool()
  const result = await pool.query<KnowledgeChunkRow>(
    `
      SELECT
        id,
        document_id AS "documentId",
        chunk_index AS "chunkIndex",
        content,
        keyword_signature AS "keywordSignature",
        embedding_json AS "embedding",
        char_count AS "charCount",
        created_at AS "createdAt"
      FROM knowledge_document_chunks
      WHERE document_id = $1
      ORDER BY chunk_index ASC, id ASC
    `,
    [documentId],
  )

  return result.rows.map(mapKnowledgeChunkRow)
}

// 读取指定文档范围内的全部可检索切块
export async function listKnowledgeChunksForSearch(documentIds?: number[]) {
  const pool = await getPostgresPool()

  if (documentIds && documentIds.length > 0) {
    const result = await pool.query<
      KnowledgeChunkRow & {
        documentTitle: string
        fileName: string
      }
    >(
      `
        SELECT
          chunk.id,
          chunk.document_id AS "documentId",
          chunk.chunk_index AS "chunkIndex",
          chunk.content,
          chunk.keyword_signature AS "keywordSignature",
          chunk.embedding_json AS "embedding",
          chunk.char_count AS "charCount",
          chunk.created_at AS "createdAt",
          doc.title AS "documentTitle",
          doc.file_name AS "fileName"
        FROM knowledge_document_chunks AS chunk
        INNER JOIN knowledge_documents AS doc ON doc.id = chunk.document_id
        WHERE doc.status = 'ready'
          AND chunk.document_id = ANY($1::int[])
        ORDER BY chunk.document_id ASC, chunk.chunk_index ASC
      `,
      [documentIds],
    )

    return result.rows.map((row) => ({
      ...mapKnowledgeChunkRow(row),
      documentTitle: row.documentTitle,
      fileName: row.fileName,
    }))
  }

  const result = await pool.query<
    KnowledgeChunkRow & {
      documentTitle: string
      fileName: string
    }
  >(
    `
      SELECT
        chunk.id,
        chunk.document_id AS "documentId",
        chunk.chunk_index AS "chunkIndex",
        chunk.content,
        chunk.keyword_signature AS "keywordSignature",
        chunk.embedding_json AS "embedding",
        chunk.char_count AS "charCount",
        chunk.created_at AS "createdAt",
        doc.title AS "documentTitle",
        doc.file_name AS "fileName"
      FROM knowledge_document_chunks AS chunk
      INNER JOIN knowledge_documents AS doc ON doc.id = chunk.document_id
      WHERE doc.status = 'ready'
      ORDER BY chunk.document_id ASC, chunk.chunk_index ASC
    `,
  )

  return result.rows.map((row) => ({
    ...mapKnowledgeChunkRow(row),
    documentTitle: row.documentTitle,
    fileName: row.fileName,
  }))
}

// 创建知识问答会话
export async function createKnowledgeSessionRecord(payload: {
  title: string
  createdById: number
  createdByName: string
}) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()
  const result = await pool.query<KnowledgeSessionRow>(
    `
      INSERT INTO knowledge_sessions (
        title,
        message_count,
        last_question,
        last_answer_summary,
        created_at,
        updated_at,
        created_by_id,
        created_by_name
      )
      VALUES ($1, 0, '', '', $2, $3, $4, $5)
      RETURNING
        id,
        title,
        message_count AS "messageCount",
        last_question AS "lastQuestion",
        last_answer_summary AS "lastAnswerSummary",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        created_by_id AS "createdById",
        created_by_name AS "createdByName"
    `,
    [payload.title, now, now, payload.createdById, payload.createdByName],
  )

  return result.rows[0] ? mapKnowledgeSessionRow(result.rows[0]) : null
}

// 根据 id 读取会话
export async function findKnowledgeSessionById(sessionId: number) {
  const pool = await getPostgresPool()
  const result = await pool.query<KnowledgeSessionRow>(
    `
      SELECT
        id,
        title,
        message_count AS "messageCount",
        last_question AS "lastQuestion",
        last_answer_summary AS "lastAnswerSummary",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        created_by_id AS "createdById",
        created_by_name AS "createdByName"
      FROM knowledge_sessions
      WHERE id = $1
      LIMIT 1
    `,
    [sessionId],
  )

  return result.rows[0] ? mapKnowledgeSessionRow(result.rows[0]) : null
}

// 读取知识问答会话列表
export async function listKnowledgeSessions() {
  const pool = await getPostgresPool()
  const result = await pool.query<KnowledgeSessionRow>(
    `
      SELECT
        id,
        title,
        message_count AS "messageCount",
        last_question AS "lastQuestion",
        last_answer_summary AS "lastAnswerSummary",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        created_by_id AS "createdById",
        created_by_name AS "createdByName"
      FROM knowledge_sessions
      ORDER BY updated_at DESC, id DESC
    `,
  )

  return result.rows.map(mapKnowledgeSessionRow)
}

// 读取会话下的全部问答消息
export async function listKnowledgeSessionMessages(sessionId: number) {
  const pool = await getPostgresPool()
  const result = await pool.query<KnowledgeSessionMessageRow>(
    `
      SELECT
        id,
        session_id AS "sessionId",
        role,
        content,
        document_ids_json AS "documentIds",
        attachments_json AS "attachments",
        citations_json AS "citations",
        runtime_json AS "runtime",
        created_at AS "createdAt"
      FROM knowledge_session_messages
      WHERE session_id = $1
      ORDER BY created_at ASC, id ASC
    `,
    [sessionId],
  )

  return result.rows.map(mapKnowledgeSessionMessageRow)
}

// 向会话写入一条问答消息
export async function createKnowledgeSessionMessageRecord(payload: {
  sessionId: number
  role: KnowledgeSessionMessageEntity['role']
  content: string
  documentIds: number[]
  attachments: KnowledgeAskAttachment[]
  citations: KnowledgeCitationItem[]
  runtime: KnowledgeSessionMessageRuntime | null
}) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()
  const result = await pool.query<KnowledgeSessionMessageRow>(
    `
      INSERT INTO knowledge_session_messages (
        session_id,
        role,
        content,
        document_ids_json,
        attachments_json,
        citations_json,
        runtime_json,
        created_at
      )
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8)
      RETURNING
        id,
        session_id AS "sessionId",
        role,
        content,
        document_ids_json AS "documentIds",
        attachments_json AS "attachments",
        citations_json AS "citations",
        runtime_json AS "runtime",
        created_at AS "createdAt"
    `,
    [
      payload.sessionId,
      payload.role,
      payload.content,
      JSON.stringify(payload.documentIds),
      JSON.stringify(payload.attachments),
      JSON.stringify(payload.citations),
      payload.runtime ? JSON.stringify(payload.runtime) : null,
      now,
    ],
  )

  return result.rows[0] ? mapKnowledgeSessionMessageRow(result.rows[0]) : null
}

// 同步更新会话的最新摘要与消息计数
export async function updateKnowledgeSessionSnapshot(payload: {
  sessionId: number
  messageCount: number
  lastQuestion: string
  lastAnswerSummary: string
}) {
  const pool = await getPostgresPool()
  const now = new Date().toISOString()

  await pool.query(
    `
      UPDATE knowledge_sessions
      SET
        message_count = $2,
        last_question = $3,
        last_answer_summary = $4,
        updated_at = $5
      WHERE id = $1
    `,
    [payload.sessionId, payload.messageCount, payload.lastQuestion, payload.lastAnswerSummary, now],
  )
}
