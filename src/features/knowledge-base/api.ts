import { requestApi } from '@/api/request'
import type {
  CreateKnowledgeDocumentPayload,
  KnowledgeAskPayload,
  KnowledgeAskResult,
  KnowledgeDocumentDetail,
  KnowledgeDocumentItem,
  KnowledgeSessionDetail,
  KnowledgeSessionItem,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const KNOWLEDGE_ASK_TIMEOUT_MS = 120000

// 获取知识库文档列表
export function fetchKnowledgeDocumentsApi() {
  return requestApi<KnowledgeDocumentItem[]>({
    url: '/knowledge/documents',
    method: 'GET',
    baseURL: API_BASE_URL,
  })
}

// 获取知识库文档详情
export function fetchKnowledgeDocumentDetailApi(id: number) {
  return requestApi<KnowledgeDocumentDetail>({
    url: `/knowledge/documents/${id}`,
    method: 'GET',
    baseURL: API_BASE_URL,
  })
}

// 上传一份知识库文档
export function createKnowledgeDocumentApi(payload: CreateKnowledgeDocumentPayload) {
  return requestApi<KnowledgeDocumentDetail, CreateKnowledgeDocumentPayload>({
    url: '/knowledge/documents',
    method: 'POST',
    data: payload,
    baseURL: API_BASE_URL,
  })
}

// 获取问答会话列表
export function fetchKnowledgeSessionsApi() {
  return requestApi<KnowledgeSessionItem[]>({
    url: '/knowledge/sessions',
    method: 'GET',
    baseURL: API_BASE_URL,
  })
}

// 获取问答会话详情
export function fetchKnowledgeSessionDetailApi(id: number) {
  return requestApi<KnowledgeSessionDetail>({
    url: `/knowledge/sessions/${id}`,
    method: 'GET',
    baseURL: API_BASE_URL,
  })
}

// 基于知识库执行问答并持久化到会话
export function askKnowledgeQuestionApi(payload: KnowledgeAskPayload) {
  return requestApi<KnowledgeAskResult, KnowledgeAskPayload>({
    url: '/knowledge/ask',
    method: 'POST',
    data: payload,
    baseURL: API_BASE_URL,
    timeout: KNOWLEDGE_ASK_TIMEOUT_MS,
    suppressGlobalErrorMessage: true,
  })
}
