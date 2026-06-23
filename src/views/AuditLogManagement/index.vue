<script setup lang="ts">
import { computed, ref } from 'vue'
import CrudTable from '@/components/CrudTable.vue'
import QueryFilterForm from '@/components/QueryFilterForm.vue'
import type { TableColumnSchema, TablePagination } from '@/components/formSchemas'
import { fetchAuditLogsApi } from '@/features/audit-log/api'
import { formatAuditAction, formatAuditModule } from '@/features/audit-log/constants'
import {
  createAuditLogQueryFields,
  createAuditLogQueryInitialValue,
} from '@/features/audit-log/formSchema'
import type { AuditLogItem, AuditLogListQuery, AuditLogQueryForm } from '@/features/audit-log/types'

const loading = ref(false)
const requestError = ref('')
const detailVisible = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const logs = ref<AuditLogItem[]>([])
const currentLog = ref<AuditLogItem | null>(null)
const queryModel = ref<AuditLogQueryForm>(createAuditLogQueryInitialValue())

const queryFields = createAuditLogQueryFields()

const pagination = computed<TablePagination>(() => ({
  currentPage: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  pageSizes: [10, 20, 50],
}))

const columns = computed<TableColumnSchema<AuditLogItem>[]>(() => [
  {
    key: 'module',
    label: '业务模块',
    prop: 'module',
    width: 120,
    formatter: (row) => formatAuditModule(row.module),
  },
  {
    key: 'action',
    label: '操作类型',
    prop: 'action',
    width: 120,
    formatter: (row) => formatAuditAction(row.action),
  },
  {
    key: 'entityName',
    label: '业务对象',
    prop: 'entityName',
    minWidth: 180,
  },
  {
    key: 'operatorName',
    label: '操作人',
    prop: 'operatorName',
    width: 120,
  },
  {
    key: 'requestId',
    label: '请求追踪号',
    prop: 'requestId',
    minWidth: 220,
  },
  {
    key: 'createdAt',
    label: '操作时间',
    prop: 'createdAt',
    minWidth: 180,
  },
])

function resolveErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试'
}

// 组装操作日志列表查询参数。
function createRequestPayload(): AuditLogListQuery {
  const createdAtRange = Array.isArray(queryModel.value.createdAtRange)
    ? queryModel.value.createdAtRange
    : []

  return {
    module: queryModel.value.module || undefined,
    action: queryModel.value.action || undefined,
    operatorName: queryModel.value.operatorName.trim() || undefined,
    entityName: queryModel.value.entityName.trim() || undefined,
    createdFrom: createdAtRange[0] || undefined,
    createdTo: createdAtRange[1] || undefined,
    page: currentPage.value,
    pageSize: pageSize.value,
  }
}

// 加载操作日志列表。
async function loadAuditLogs(options: { resetPage?: boolean } = {}) {
  loading.value = true
  requestError.value = ''

  try {
    if (options.resetPage) {
      currentPage.value = 1
    }

    const result = await fetchAuditLogsApi(createRequestPayload())
    logs.value = result.list
    total.value = result.total
    currentPage.value = result.page
    pageSize.value = result.pageSize
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

// 查询日志列表。
async function handleSearch() {
  await loadAuditLogs({ resetPage: true })
}

// 重置筛选条件并重新加载列表。
async function handleReset() {
  queryModel.value = createAuditLogQueryInitialValue()
  await loadAuditLogs({ resetPage: true })
}

// 切换分页页码。
function handlePageChange(page: number) {
  currentPage.value = page
  void loadAuditLogs()
}

// 切换每页条数。
function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  void loadAuditLogs()
}

// 打开日志详情弹窗。
function openDetail(row: AuditLogItem) {
  currentLog.value = row
  detailVisible.value = true
}

// 关闭日志详情弹窗。
function closeDetail() {
  detailVisible.value = false
  currentLog.value = null
}

// 格式化 JSON 数据展示。
function formatDetailContent(value: unknown) {
  if (value == null) {
    return '无'
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

void loadAuditLogs()
</script>

<template>
  <section class="audit-log-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">审计追踪</p>
        <h2>操作日志</h2>
        <p class="intro">集中查看车辆管理中的新增、编辑、删除日志，方便问题追踪与过程复盘。</p>
      </div>

      <div class="head-actions">
        <el-button :loading="loading" @click="loadAuditLogs({ resetPage: true })">刷新</el-button>
      </div>
    </div>

    <QueryFilterForm
      v-model="queryModel"
      :fields="queryFields"
      :loading="loading"
      :columns="3"
      submit-text="查询"
      reset-text="重置"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div v-if="requestError" class="error-banner">{{ requestError }}</div>

    <CrudTable
      :rows="logs"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      :selection-enabled="false"
      empty-text="暂无操作日志"
      operation-label="操作"
      :operation-width="120"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #operation="{ row }">
        <el-button link type="primary" @click.stop="openDetail(row)">查看详情</el-button>
      </template>
    </CrudTable>

    <el-dialog
      v-model="detailVisible"
      title="日志详情"
      width="780px"
      destroy-on-close
      @closed="closeDetail"
    >
      <div v-if="currentLog" class="detail-content">
        <div class="detail-summary">
          <div class="summary-item">
            <span class="summary-label">业务模块</span>
            <strong>{{ formatAuditModule(currentLog.module) }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">操作类型</span>
            <strong>{{ formatAuditAction(currentLog.action) }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">业务对象</span>
            <strong>{{ currentLog.entityName }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">操作人</span>
            <strong>{{ currentLog.operatorName }}</strong>
          </div>
          <div class="summary-item summary-item-wide">
            <span class="summary-label">请求追踪号</span>
            <strong>{{ currentLog.requestId }}</strong>
          </div>
        </div>

        <div class="detail-panels">
          <div class="detail-panel">
            <h3>变更前</h3>
            <pre>{{ formatDetailContent(currentLog.beforeData) }}</pre>
          </div>
          <div class="detail-panel">
            <h3>变更后</h3>
            <pre>{{ formatDetailContent(currentLog.afterData) }}</pre>
          </div>
        </div>
      </div>
    </el-dialog>
  </section>
</template>

<style scoped lang="less">
.audit-log-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  .page-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    border: 1px solid rgba(29, 59, 54, 0.1);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 18px 40px rgba(19, 35, 33, 0.08);

    .eyebrow {
      color: #7a5d2d;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h2 {
      margin-top: 0.35rem;
      color: #173937;
      font-size: 1.75rem;
      font-weight: 700;
    }

    .intro {
      max-width: 44rem;
      margin-top: 0.75rem;
      color: #556260;
    }

    .head-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  }

  .error-banner {
    padding: 1rem 1.2rem;
    border: 1px solid rgba(248, 113, 113, 0.2);
    border-radius: 18px;
    background: rgba(248, 113, 113, 0.08);
    color: #dc2626;
  }
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .detail-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding: 0.9rem 1rem;
      border: 1px solid rgba(29, 59, 54, 0.08);
      border-radius: 16px;
      background: #f8faf9;

      .summary-label {
        color: #6b7280;
        font-size: 0.82rem;
      }
    }

    .summary-item-wide {
      grid-column: 1 / -1;
    }
  }

  .detail-panels {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;

    .detail-panel {
      padding: 1rem;
      border: 1px solid rgba(29, 59, 54, 0.08);
      border-radius: 18px;
      background: #ffffff;

      h3 {
        margin-bottom: 0.75rem;
        color: #173937;
        font-size: 1rem;
        font-weight: 700;
      }

      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
        font-size: 0.82rem;
        line-height: 1.6;
        color: #334155;
      }
    }
  }
}

@media (max-width: 980px) {
  .audit-log-page {
    .page-head {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .detail-content {
    .detail-summary,
    .detail-panels {
      grid-template-columns: 1fr;
    }
  }
}
</style>
