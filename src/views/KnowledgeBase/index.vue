<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  askKnowledgeQuestionApi,
  createKnowledgeDocumentApi,
  fetchKnowledgeDocumentDetailApi,
  fetchKnowledgeDocumentsApi,
  fetchKnowledgeSessionDetailApi,
  fetchKnowledgeSessionsApi,
} from '@/features/knowledge-base/api'
import { parseKnowledgeAttachment } from '@/features/knowledge-base/documentParser'
import type {
  KnowledgeAskAttachment,
  KnowledgeDocumentDetail,
  KnowledgeDocumentItem,
  KnowledgeSessionDetail,
  KnowledgeSessionItem,
  KnowledgeSessionMessageItem,
} from '@/features/knowledge-base/types'

const loading = ref(false)
const uploading = ref(false)
const asking = ref(false)
const requestError = ref('')
const question = ref('')
const uploadTitle = ref('')
const selectedDocumentIds = ref<number[]>([])
const selectedFileName = ref('')
const selectedRawContent = ref('')
const sessionAttachments = ref<KnowledgeAskAttachment[]>([])
const pendingSessionTitle = ref('')
const documents = ref<KnowledgeDocumentItem[]>([])
const sessions = ref<KnowledgeSessionItem[]>([])
const activeDocument = ref<KnowledgeDocumentDetail | null>(null)
const activeSession = ref<KnowledgeSessionDetail | null>(null)

// 生成文档下拉选项
const documentOptions = computed(() =>
  documents.value.map((item) => ({
    label: `${item.title}（${item.chunkCount} 段）`,
    value: item.id,
  })),
)

// 基于当前会话推导出最新的 AI 回答
const latestAssistantMessage = computed(() => {
  if (!activeSession.value) {
    return null
  }

  const messages = [...activeSession.value.messages].reverse()
  return messages.find((item) => item.role === 'assistant') ?? null
})

// 统一提取错误文案
function resolveErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试'
}

// 格式化时间展示
function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('zh-CN', { hour12: false })
}

// 格式化文档状态
function formatDocumentStatus(status: KnowledgeDocumentItem['status']) {
  if (status === 'ready') {
    return '已就绪'
  }

  if (status === 'processing') {
    return '处理中'
  }

  return '失败'
}

// 格式化引用来源类型
function formatCitationSourceType(sourceType: 'knowledge-document' | 'session-file') {
  return sourceType === 'session-file' ? '会话文件' : '知识库文档'
}

// 格式化消息角色
function formatMessageRole(role: KnowledgeSessionMessageItem['role']) {
  return role === 'user' ? '我' : 'AI'
}

// 加载页面所需的初始数据
async function loadKnowledgePageData() {
  loading.value = true
  requestError.value = ''

  try {
    const [documentResult, sessionResult] = await Promise.all([
      fetchKnowledgeDocumentsApi(),
      fetchKnowledgeSessionsApi(),
    ])

    documents.value = documentResult
    sessions.value = sessionResult

    if (!activeDocument.value && documentResult[0]) {
      await handleSelectDocument(documentResult[0].id)
    }

    if (!activeSession.value && sessionResult[0]) {
      await handleSelectSession(sessionResult[0].id)
    }
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

// 读取单个知识库文档详情
async function handleSelectDocument(documentId: number) {
  if (!documentId) {
    activeDocument.value = null
    return
  }

  try {
    activeDocument.value = await fetchKnowledgeDocumentDetailApi(documentId)
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  }
}

// 读取单个问答会话详情
async function handleSelectSession(sessionId: number) {
  if (!sessionId) {
    activeSession.value = null
    return
  }

  try {
    activeSession.value = await fetchKnowledgeSessionDetailApi(sessionId)
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  }
}

// 新建空会话，用于发起新的问答上下文
function handleStartNewSession() {
  activeSession.value = null
  question.value = ''
  sessionAttachments.value = []
  pendingSessionTitle.value = ''
}

// 读取知识库上传文件内容
async function handleFileChange(uploadFile: File) {
  const parsedAttachment = await parseKnowledgeAttachment(uploadFile)
  selectedFileName.value = parsedAttachment.fileName
  selectedRawContent.value = parsedAttachment.rawContent

  if (!uploadTitle.value.trim()) {
    uploadTitle.value = parsedAttachment.title
  }
}

// 处理知识库上传文件选择
async function handleFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  await handleFileChange(file)
}

// 读取当前会话附件，作为单次问答增强
async function handleSessionFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  if (files.length === 0) {
    return
  }

  const attachments = await Promise.all(files.map((file) => parseKnowledgeAttachment(file)))
  sessionAttachments.value = attachments.filter((item) => item.rawContent.trim())
}

// 清空当前会话附件
function handleClearSessionAttachments() {
  sessionAttachments.value = []
}

// 上传知识库文档并刷新列表
async function handleUploadDocument() {
  if (!uploadTitle.value.trim()) {
    ElMessage.warning('请输入文档标题')
    return
  }

  if (!selectedRawContent.value.trim()) {
    ElMessage.warning('请先选择一个可解析的文档文件')
    return
  }

  uploading.value = true
  requestError.value = ''

  try {
    const created = await createKnowledgeDocumentApi({
      title: uploadTitle.value.trim(),
      fileName: selectedFileName.value || `${uploadTitle.value.trim()}.txt`,
      contentType: 'text/plain',
      rawContent: selectedRawContent.value,
    })

    ElMessage.success('知识库文档上传成功')
    uploadTitle.value = ''
    selectedFileName.value = ''
    selectedRawContent.value = ''
    documents.value = await fetchKnowledgeDocumentsApi()
    activeDocument.value = created
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    uploading.value = false
  }
}

// 基于知识库和会话历史执行问答
async function handleAskQuestion() {
  if (!question.value.trim()) {
    ElMessage.warning('请输入要提问的问题')
    return
  }

  asking.value = true
  requestError.value = ''

  try {
    const result = await askKnowledgeQuestionApi({
      question: question.value.trim(),
      documentIds: selectedDocumentIds.value,
      attachments: sessionAttachments.value,
      sessionId: activeSession.value?.id,
      sessionTitle: pendingSessionTitle.value.trim(),
      topK: 4,
    })

    const sessionList = await fetchKnowledgeSessionsApi()
    sessions.value = sessionList
    activeSession.value = await fetchKnowledgeSessionDetailApi(result.sessionId)
    pendingSessionTitle.value = result.sessionTitle
    question.value = ''
    sessionAttachments.value = []
    ElMessage.success('知识库问答完成，记录已写入会话')
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    asking.value = false
  }
}

void loadKnowledgePageData()
</script>

<template>
  <section class="knowledge-base-page">
    <div class="page-head">
      <div class="page-head__content">
        <p class="eyebrow">RAG 知识问答</p>
        <h2>知识库问答中心</h2>
        <p class="intro">
          把公司内部文档切块入库后，支持基于知识库与会话附件做检索增强问答；同时持久化会话历史、问题、回答、引用和运行策略，方便复盘与继续追问。
        </p>
      </div>

      <div class="page-head__actions">
        <el-button size="small" :loading="loading" @click="loadKnowledgePageData">刷新</el-button>
      </div>
    </div>

    <div v-if="requestError" class="error-banner">{{ requestError }}</div>

    <div class="knowledge-layout">
      <section class="panel-card panel-card--upload">
        <div class="panel-head">
          <div>
            <h3>上传知识文档</h3>
            <p>支持 txt、md、csv、pdf、docx，解析后会切块入库，用于后续检索与问答。</p>
          </div>
        </div>

        <div class="upload-form">
          <label class="upload-label">
            <span>文档标题</span>
            <el-input v-model="uploadTitle" maxlength="120" placeholder="例如：车辆维修作业规范" />
          </label>

          <label class="upload-label">
            <span>选择文件</span>
            <input type="file" accept=".txt,.md,.csv,.pdf,.docx" @change="handleFileInputChange" />
          </label>

          <div class="upload-preview">
            <span>当前文件：{{ selectedFileName || '未选择' }}</span>
            <span>文本长度：{{ selectedRawContent.length }} 字</span>
          </div>

          <div class="upload-actions">
            <el-button type="primary" :loading="uploading" @click="handleUploadDocument">
              上传到知识库
            </el-button>
          </div>
        </div>
      </section>

      <section class="panel-card panel-card--documents">
        <div class="panel-head">
          <div>
            <h3>知识库文档</h3>
            <p>上传后会立刻切块入库，作为检索增强问答的主要来源。</p>
          </div>
        </div>

        <div v-if="documents.length === 0" class="empty-state">当前还没有知识库文档</div>

        <div v-else class="document-list">
          <article
            v-for="item in documents"
            :key="item.id"
            class="document-card"
            :class="{ 'document-card--active': activeDocument?.id === item.id }"
            @click="handleSelectDocument(item.id)"
          >
            <div class="document-card__top">
              <h4>{{ item.title }}</h4>
              <span>{{ formatDocumentStatus(item.status) }}</span>
            </div>
            <p>{{ item.summary }}</p>
            <div class="document-card__meta">
              <span>{{ item.fileName }}</span>
              <span>{{ item.chunkCount }} 段</span>
              <span>{{ formatDateTime(item.updatedAt) }}</span>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div class="session-layout">
      <section class="panel-card panel-card--session-list">
        <div class="panel-head">
          <div>
            <h3>问答会话</h3>
            <p>每次提问都会保存到会话里，方便复盘和继续追问。</p>
          </div>

          <el-button link type="primary" @click="handleStartNewSession">新建会话</el-button>
        </div>

        <label class="upload-label">
          <span>新会话标题</span>
          <el-input
            v-model="pendingSessionTitle"
            maxlength="120"
            placeholder="不填则默认取第一条问题前 40 个字"
          />
        </label>

        <div v-if="sessions.length === 0" class="empty-state">当前还没有问答会话</div>

        <div v-else class="session-list">
          <article
            v-for="item in sessions"
            :key="item.id"
            class="session-card"
            :class="{ 'session-card--active': activeSession?.id === item.id }"
            @click="handleSelectSession(item.id)"
          >
            <div class="session-card__top">
              <strong>{{ item.title }}</strong>
              <span>{{ item.messageCount }} 条</span>
            </div>
            <p>{{ item.lastQuestion || '还没有问题记录' }}</p>
            <div class="session-card__meta">
              <span>{{ item.lastAnswerSummary || '暂无回答摘要' }}</span>
              <span>{{ formatDateTime(item.updatedAt) }}</span>
            </div>
          </article>
        </div>
      </section>

      <section class="panel-card panel-card--qa">
        <div class="panel-head">
          <div>
            <h3>会话问答</h3>
            <p>支持限定知识库文档、追加会话附件，并在当前会话中持续追问。</p>
          </div>
        </div>

        <div class="qa-form">
          <label class="upload-label">
            <span>限定文档</span>
            <el-select
              v-model="selectedDocumentIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="不选择时默认检索整个知识库"
            >
              <el-option
                v-for="item in documentOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </label>

          <label class="upload-label">
            <span>提问内容</span>
            <el-input
              v-model="question"
              type="textarea"
              :rows="4"
              maxlength="500"
              placeholder="例如：结合维修规范和这次会议纪要，停用车辆恢复使用前要确认哪些字段"
            />
          </label>

          <label class="upload-label">
            <span>当前会话文件</span>
            <input
              type="file"
              multiple
              accept=".txt,.md,.csv,.pdf,.docx"
              @change="handleSessionFileInputChange"
            />
          </label>

          <div class="session-attachments">
            <div class="session-attachments__head">
              <strong>会话增强文件</strong>
              <el-button link type="primary" @click="handleClearSessionAttachments">清空</el-button>
            </div>

            <div v-if="sessionAttachments.length === 0" class="empty-state empty-state--compact">
              当前没有会话增强文件
            </div>

            <div v-else class="session-attachment-list">
              <article
                v-for="attachment in sessionAttachments"
                :key="attachment.fileName"
                class="session-attachment-card"
              >
                <strong>{{ attachment.title }}</strong>
                <span>{{ attachment.fileName }}</span>
                <span>{{ attachment.rawContent.length }} 字</span>
              </article>
            </div>
          </div>

          <div class="upload-actions">
            <el-button type="primary" :loading="asking" @click="handleAskQuestion">
              开始问答
            </el-button>
          </div>
        </div>

        <div v-if="latestAssistantMessage" class="answer-panel">
          <div class="answer-panel__head">
            <h4>最新回答</h4>
            <span>
              {{ latestAssistantMessage.runtime?.provider || 'Rule Retrieval' }}
              /
              {{ latestAssistantMessage.runtime?.model || 'local-keyword-search' }}
              /
              {{ latestAssistantMessage.runtime?.retrievalStrategy || 'keyword-fallback' }}
            </span>
          </div>

          <p class="answer-panel__text">{{ latestAssistantMessage.content }}</p>

          <div class="citation-list">
            <article
              v-for="citation in latestAssistantMessage.citations"
              :key="citation.chunkId"
              class="citation-card"
            >
              <div class="citation-card__top">
                <strong>{{ citation.documentTitle }}</strong>
                <span>命中分：{{ citation.score }}</span>
              </div>
              <p>{{ citation.excerpt }}</p>
              <div class="citation-card__meta">
                <span>{{ formatCitationSourceType(citation.sourceType) }}</span>
                <span>{{ citation.fileName }}</span>
                <span>片段 {{ citation.chunkIndex }}</span>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>

    <div class="qa-layout">
      <section class="panel-card panel-card--history">
        <div class="panel-head">
          <div>
            <h3>会话历史</h3>
            <p>展示用户问题、AI 回答、引用信息和运行策略，便于继续追问与结果复盘。</p>
          </div>
        </div>

        <div v-if="!activeSession" class="empty-state">请选择一个会话，或者直接发起新的问题</div>

        <div v-else class="history-panel">
          <div class="detail-panel__meta">
            <strong>{{ activeSession.title }}</strong>
            <span>{{ activeSession.messageCount }} 条消息</span>
            <span>{{ formatDateTime(activeSession.updatedAt) }}</span>
          </div>

          <div v-if="activeSession.messages.length === 0" class="empty-state empty-state--compact">
            当前会话还没有消息
          </div>

          <div v-else class="message-list">
            <article
              v-for="message in activeSession.messages"
              :key="message.id"
              class="message-card"
              :class="{
                'message-card--assistant': message.role === 'assistant',
                'message-card--user': message.role === 'user',
              }"
            >
              <div class="message-card__top">
                <strong>{{ formatMessageRole(message.role) }}</strong>
                <span>{{ formatDateTime(message.createdAt) }}</span>
              </div>
              <p>{{ message.content }}</p>

              <div v-if="message.runtime" class="message-card__meta">
                <span>{{ message.runtime.provider }}</span>
                <span>{{ message.runtime.model }}</span>
                <span>{{ message.runtime.retrievalStrategy }}</span>
              </div>

              <div v-if="message.attachments.length > 0" class="message-card__attachments">
                <strong>本轮附件</strong>
                <div class="session-attachment-list">
                  <article
                    v-for="attachment in message.attachments"
                    :key="`${message.id}-${attachment.fileName}`"
                    class="session-attachment-card"
                  >
                    <strong>{{ attachment.title }}</strong>
                    <span>{{ attachment.fileName }}</span>
                    <span>{{ attachment.rawContent.length }} 字</span>
                  </article>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="panel-card panel-card--detail">
        <div class="panel-head">
          <div>
            <h3>文档预览</h3>
            <p>查看原文和切块结果，验证召回片段是否合理。</p>
          </div>
        </div>

        <div v-if="!activeDocument" class="empty-state">请选择一份知识库文档查看详情</div>

        <div v-else class="detail-panel">
          <div class="detail-panel__meta">
            <strong>{{ activeDocument.title }}</strong>
            <span>{{ activeDocument.fileName }}</span>
            <span>{{ activeDocument.chunkCount }} 段</span>
          </div>

          <div class="detail-panel__summary">{{ activeDocument.summary }}</div>

          <div class="chunk-list">
            <article v-for="chunk in activeDocument.chunks" :key="chunk.id" class="chunk-card">
              <div class="chunk-card__top">
                <strong>片段 {{ chunk.chunkIndex }}</strong>
                <span>{{ chunk.charCount }} 字</span>
              </div>
              <p>{{ chunk.content }}</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped lang="less">
.knowledge-base-page {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .page-head,
  .panel-card,
  .error-banner {
    border: 1px solid #d8e1eb;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  }

  .page-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 24px;

    &__content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    &__actions {
      display: flex;
      align-items: flex-start;
    }
  }

  .eyebrow {
    margin: 0;
    color: #0f766e;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  h2,
  h3,
  h4,
  p {
    margin: 0;
  }

  .intro {
    max-width: 760px;
    color: #526071;
    line-height: 1.7;
  }

  .error-banner {
    padding: 12px 16px;
    color: #b42318;
    background: #fff5f4;
    border-color: #fecdca;
  }

  .knowledge-layout,
  .session-layout,
  .qa-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .panel-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;

    p {
      color: #667085;
      line-height: 1.6;
    }
  }

  .upload-form,
  .qa-form,
  .detail-panel,
  .answer-panel,
  .session-attachments,
  .history-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .upload-label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: #344054;
    font-size: 14px;
  }

  .upload-preview,
  .upload-actions,
  .document-card__meta,
  .session-card__meta,
  .citation-card__meta,
  .detail-panel__meta,
  .chunk-card__top,
  .document-card__top,
  .session-card__top,
  .citation-card__top,
  .answer-panel__head,
  .session-attachments__head,
  .session-attachment-card,
  .message-card__top,
  .message-card__meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .upload-preview,
  .document-card__meta,
  .session-card__meta,
  .citation-card__meta,
  .detail-panel__meta,
  .answer-panel__head,
  .session-attachment-card,
  .message-card__meta,
  .message-card__top {
    color: #667085;
    font-size: 13px;
  }

  .document-list,
  .session-list,
  .citation-list,
  .chunk-list,
  .session-attachment-list,
  .message-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .document-card,
  .session-card,
  .citation-card,
  .chunk-card,
  .session-attachment-card,
  .message-card {
    border: 1px solid #e4e7ec;
    border-radius: 12px;
    padding: 14px 16px;
    background: #fcfcfd;
  }

  .document-card,
  .session-card {
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      transform 0.2s ease;

    &:hover {
      border-color: #14b8a6;
      transform: translateY(-1px);
    }
  }

  .document-card--active,
  .session-card--active {
    border-color: #0f766e;
    background: #f0fdfa;
  }

  .detail-panel__summary,
  .answer-panel__text,
  .document-card p,
  .session-card p,
  .citation-card p,
  .chunk-card p,
  .message-card p {
    color: #344054;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .message-card {
    &--assistant {
      background: #f8fafc;
    }

    &--user {
      background: #f0fdfa;
      border-color: #99f6e4;
    }
  }

  .message-card__attachments {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 8px;
    border-top: 1px dashed #d0d5dd;
  }

  .empty-state {
    border: 1px dashed #d0d5dd;
    border-radius: 12px;
    padding: 20px;
    color: #667085;
    text-align: center;
    background: #f8fafc;
  }

  .empty-state--compact {
    padding: 14px;
  }

  input[type='file'] {
    border: 1px solid #d0d5dd;
    border-radius: 10px;
    padding: 10px 12px;
    background: #fff;
  }

  @media (max-width: 1200px) {
    .knowledge-layout,
    .session-layout,
    .qa-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .page-head {
      flex-direction: column;
      padding: 18px;
    }

    .panel-card {
      padding: 16px;
    }
  }
}
</style>
