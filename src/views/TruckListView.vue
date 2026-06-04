<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchTruckListApi } from '@/api/truck'
import CrudTable from '@/components/CrudTable.vue'
import QueryFilterForm from '@/components/QueryFilterForm.vue'
import type {
  FormFieldSchema,
  FormModel,
  TableBatchAction,
  TableColumnSchema,
  TablePagination,
} from '@/components/formSchemas'
import { createModelFromFields } from '@/components/formSchemas'
import { useRequest } from '@/composables/useRequest'
import { usePermission } from '@/features/auth/usePermission'
import { generateTruckAssist } from '@/services/ai'
import type { AiAssistResult, TruckAiAssistDto } from '@/services/ai/types'
import type { TruckItem, TruckListQuery } from '@/types/truck'

type TableLikeTruckRow = TruckItem & Record<string, unknown>

const { hasPermission } = usePermission()

const truckTypeOptions = [
  { label: '全部类型', value: '' },
  { label: '车型 1', value: 1 },
  { label: '车型 2', value: 2 },
]

const queryFields: FormFieldSchema[] = [
  {
    key: 'truckType',
    label: '车辆类型',
    type: 'select',
    options: truckTypeOptions,
    defaultValue: '',
  },
  {
    key: 'tractorLicensePlateNo',
    label: '车头牌照',
    type: 'input',
    defaultValue: '',
  },
  {
    key: 'trailerLicensePlateNo',
    label: '挂车牌照',
    type: 'input',
    defaultValue: '',
  },
  {
    key: 'isDriverLicenseExpire',
    label: '司机证过期',
    type: 'switch',
    defaultValue: false,
  },
  {
    key: 'isVehicleLicenseExpire',
    label: '行驶证过期',
    type: 'switch',
    defaultValue: false,
  },
  {
    key: 'isBusinessExpire',
    label: '营运证过期',
    type: 'switch',
    defaultValue: false,
  },
  {
    key: 'isCompulsoryExpire',
    label: '交强险过期',
    type: 'switch',
    defaultValue: false,
  },
]

const queryModel = ref<FormModel>(
  createModelFromFields(queryFields, {
    truckType: '',
    tractorLicensePlateNo: '',
    trailerLicensePlateNo: '',
    isDriverLicenseExpire: false,
    isVehicleLicenseExpire: false,
    isBusinessExpire: false,
    isCompulsoryExpire: false,
  }),
)

const pagination = reactive<TablePagination>({
  currentPage: 1,
  pageSize: 50,
  total: 0,
  pageSizes: [20, 50, 100],
})

const sortState = reactive<{
  prop: string | null
  order: 'ascending' | 'descending' | null
}>({
  prop: null,
  order: null,
})

const selectedRows = ref<TableLikeTruckRow[]>([])
const detailVisible = ref(false)
const aiPanelVisible = ref(false)
const activeTruck = ref<TableLikeTruckRow | null>(null)
const aiLoading = ref(false)
const aiError = ref('')
const aiResult = ref<AiAssistResult | null>(null)

const columns: TableColumnSchema<TableLikeTruckRow>[] = [
  {
    key: 'index',
    label: '#',
    width: 72,
    formatter: (_row, index) => (pagination.currentPage - 1) * pagination.pageSize + index + 1,
  },
  {
    key: 'tractorLicensePlateNo',
    label: '车头牌照',
    prop: 'tractorLicensePlateNo',
    minWidth: 150,
    sortable: 'custom',
  },
  {
    key: 'trailerLicensePlateNo',
    label: '挂车牌照',
    prop: 'trailerLicensePlateNo',
    minWidth: 150,
  },
  {
    key: 'truckType',
    label: '车辆类型',
    prop: 'truckType',
    width: 120,
    sortable: 'custom',
    formatter: (row) => formatTruckType(row.truckType),
  },
  {
    key: 'truckModel',
    label: '车辆型号',
    prop: 'truckModel',
    width: 120,
  },
  {
    key: 'whiteTruckFlag',
    label: '白名单',
    prop: 'whiteTruckFlag',
    width: 96,
    formatter: (row) => formatYesNo(row.whiteTruckFlag),
  },
  {
    key: 'powerType',
    label: '动力类型',
    prop: 'powerType',
    width: 110,
    formatter: (row) => formatPowerType(row.powerType),
  },
  {
    key: 'modifyPersonName',
    label: '更新人',
    prop: 'modifyPersonName',
    width: 140,
  },
  {
    key: 'modifyTime',
    label: '更新时间',
    prop: 'modifyTime',
    minWidth: 170,
  },
]

const batchActions = computed<TableBatchAction<TableLikeTruckRow>[]>(() =>
  hasPermission('truck:batch')
    ? [
        {
          key: 'export',
          label: '批量导出',
          type: 'primary',
        },
        {
          key: 'tag',
          label: '批量打标',
          type: 'success',
        },
      ]
    : [],
)

const { data, loading, error, run, clearError } = useRequest(fetchTruckListApi)

const tableRows = computed<TableLikeTruckRow[]>(() => {
  const rows = (data.value?.list ?? []) as TableLikeTruckRow[]

  if (!sortState.prop || !sortState.order) {
    return rows
  }

  const direction = sortState.order === 'ascending' ? 1 : -1
  const sortedRows = [...rows]

  sortedRows.sort((left, right) => {
    const leftValue = left[sortState.prop as keyof TruckItem]
    const rightValue = right[sortState.prop as keyof TruckItem]

    return String(leftValue ?? '').localeCompare(String(rightValue ?? '')) * direction
  })

  return sortedRows
})

function createRequestPayload(): TruckListQuery {
  return {
    truckType: (queryModel.value.truckType as TruckListQuery['truckType']) ?? '',
    tractorLicensePlateNo: String(queryModel.value.tractorLicensePlateNo ?? ''),
    trailerLicensePlateNo: String(queryModel.value.trailerLicensePlateNo ?? ''),
    pageIndex: pagination.currentPage - 1,
    pageSize: pagination.pageSize,
    isDriverLicenseExpire: Boolean(queryModel.value.isDriverLicenseExpire),
    isVehicleLicenseExpire: Boolean(queryModel.value.isVehicleLicenseExpire),
    isBusinessExpire: Boolean(queryModel.value.isBusinessExpire),
    isCompulsoryExpire: Boolean(queryModel.value.isCompulsoryExpire),
  }
}

async function loadTruckList() {
  try {
    clearError()
    const response = await run(createRequestPayload())
    pagination.total = response.total
  } catch {
    // 请求层已统一处理错误提示。
  }
}

async function handleSearch() {
  pagination.currentPage = 1
  await loadTruckList()
}

async function handleReset() {
  pagination.currentPage = 1
  sortState.prop = null
  sortState.order = null
  await loadTruckList()
}

async function handlePageChange(page: number) {
  pagination.currentPage = page
  await loadTruckList()
}

async function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.currentPage = 1
  await loadTruckList()
}

function handleSelectionChange(rows: Record<string, unknown>[]) {
  selectedRows.value = rows as TableLikeTruckRow[]
}

function handleSortChange(payload: {
  prop: string | null
  order: 'ascending' | 'descending' | null
}) {
  sortState.prop = payload.prop
  sortState.order = payload.order
}

function handleBatchAction(payload: { actionKey: string; rows: Record<string, unknown>[] }) {
  console.log('batch action', {
    actionKey: payload.actionKey,
    rows: payload.rows as TableLikeTruckRow[],
  })
}

function handleRowClick(row: Record<string, unknown>) {
  activeTruck.value = row as TableLikeTruckRow
  detailVisible.value = true
  aiPanelVisible.value = false
  aiError.value = ''
  aiResult.value = null
}

async function handleOpenAiAssist() {
  if (!activeTruck.value) {
    return
  }

  aiPanelVisible.value = true
  aiLoading.value = true
  aiError.value = ''

  try {
    aiResult.value = await generateTruckAssist(createTruckAssistDto(activeTruck.value))
  } catch (requestError) {
    aiError.value = requestError instanceof Error ? requestError.message : 'AI 助手暂时不可用。'
    aiResult.value = null
  } finally {
    aiLoading.value = false
  }
}

async function handleCopyAiResult() {
  if (!aiResult.value) {
    return
  }

  try {
    await navigator.clipboard.writeText(formatAiAssistForCopy(aiResult.value))
    ElMessage.success('AI 结果已复制。')
  } catch {
    ElMessage.error('复制失败，请重试。')
  }
}

function formatTruckType(truckType: TruckItem['truckType']) {
  if (truckType === null) {
    return '-'
  }

  return truckType === 1 ? '车型 1' : truckType === 2 ? '车型 2' : String(truckType)
}

function formatYesNo(value: number | null) {
  if (value === null) {
    return '-'
  }

  return value === 1 ? '是' : '否'
}

function formatPowerType(value: TruckItem['powerType']) {
  if (value === null) {
    return '-'
  }

  if (value === 1) {
    return '燃油'
  }

  if (value === 2) {
    return '电动'
  }

  return String(value)
}

function formatDateTime(value: string | null) {
  return value || '-'
}

function formatConsumption(value: TruckItem['consumption']) {
  if (value === null) {
    return '-'
  }

  return String(value)
}

function createTruckAssistDto(row: TableLikeTruckRow): TruckAiAssistDto {
  const tractorLicensePlateNo = String(row.tractorLicensePlateNo ?? '').trim()
  const trailerLicensePlateNo = String(row.trailerLicensePlateNo ?? '').trim()
  const truckModel = String(row.truckModel ?? '').trim()
  const updatedBy = String(row.modifyPersonName ?? '').trim()
  const updatedAt = String(row.modifyTime ?? '').trim()
  const whiteTruckFlag = row.whiteTruckFlag as TruckItem['whiteTruckFlag']
  const whiteTruckNo = String(row.whiteTruckNo ?? '').trim()
  const consumption = typeof row.consumption === 'number' ? row.consumption : null
  const daysSinceUpdate = getDaysSince(updatedAt)

  const missingFieldCount = [
    !tractorLicensePlateNo,
    !trailerLicensePlateNo,
    !truckModel,
    !updatedBy,
    consumption === null,
  ].filter(Boolean).length

  return {
    id: Number(row.id),
    truckType: formatTruckType(row.truckType as TruckItem['truckType']),
    tractorLicensePlateNo: tractorLicensePlateNo || '-',
    trailerLicensePlateNo: trailerLicensePlateNo || '-',
    truckModel: truckModel || '-',
    whiteTruckLabel: formatYesNo(whiteTruckFlag),
    powerType: formatPowerType(row.powerType as TruckItem['powerType']),
    updatedBy: updatedBy || '未知操作人',
    updatedAt: updatedAt || '-',
    flags: {
      missingTractorPlate: !tractorLicensePlateNo,
      missingTrailerPlate: !trailerLicensePlateNo,
      missingModel: !truckModel,
      highUnknownFieldRatio: missingFieldCount >= 3,
      missingUpdateOwner: !updatedBy,
      staleRecord: daysSinceUpdate !== null && daysSinceUpdate > 30,
      whiteListMissingCode: whiteTruckFlag === 1 && !whiteTruckNo,
      fuelConsumptionMissing: consumption === null,
    },
    metrics: {
      consumption,
      daysSinceUpdate,
    },
  }
}

function getDaysSince(value: string) {
  if (!value) {
    return null
  }

  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    return null
  }

  const diff = Date.now() - timestamp
  return diff < 0 ? 0 : Math.floor(diff / (1000 * 60 * 60 * 24))
}

function formatAiAssistForCopy(result: AiAssistResult) {
  return [
    '摘要',
    ...result.summary.map((item, index) => `${index + 1}. ${item}`),
    '',
    '风险点',
    ...result.risks.map((item, index) => `${index + 1}. ${item}`),
    '',
    '下一步建议',
    ...result.nextActions.map((item, index) => `${index + 1}. ${item}`),
    '',
    `置信度：${formatConfidence(result.confidence)}`,
    `来源：${formatSource(result.source)}`,
  ].join('\n')
}

function formatConfidence(value: AiAssistResult['confidence']) {
  return value === 'high' ? '高' : value === 'medium' ? '中' : '低'
}

function formatSource(value: AiAssistResult['source']) {
  return value === 'mock' ? '模拟 AI' : '兜底规则'
}

onMounted(async () => {
  await loadTruckList()
})
</script>

<template>
  <section class="truck-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">受限模块</p>
        <h2>车辆列表</h2>
        <p class="intro">这个页面在路由层仅对管理员开放，批量操作也会继续受到页面级权限控制。</p>
        <p
          v-permission="{ permissions: 'truck:batch' }"
          class="permission-copy permission-copy-granted"
        >
          当前角色可使用批量操作。
        </p>
        <p v-if="!hasPermission('truck:batch')" class="permission-copy">
          当前角色可以查看车辆记录，但批量操作会因权限限制而隐藏。
        </p>
      </div>

      <div class="head-card">
        <span>记录总数</span>
        <strong>{{ pagination.total }}</strong>
        <small>数据来自后端分页结果</small>
      </div>
    </div>

    <QueryFilterForm
      v-model="queryModel"
      :fields="queryFields"
      :loading="loading"
      submit-text="查询"
      reset-text="重置"
      @search="handleSearch"
      @reset="handleReset"
    />

    <div v-if="error" class="error-banner">{{ error }}</div>

    <CrudTable
      :rows="tableRows"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      :batch-actions="batchActions"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @batch-action="handleBatchAction"
      @row-click="handleRowClick"
    />

    <div class="page-note">
      <strong>权限分层说明</strong>
      <p>页面访问通过路由 meta 限定为 `admin`。</p>
      <p>批量按钮再通过操作权限单独控制。</p>
      <p>这种拆分很常见：先控页面权限，再控按钮级操作权限。</p>
      <p>当前已选：{{ selectedRows.length }} 条</p>
    </div>

    <el-drawer v-model="detailVisible" title="车辆详情" size="760px" destroy-on-close>
      <template v-if="activeTruck">
        <section class="detail-shell">
          <div class="detail-header">
            <div>
              <p class="eyebrow">详情查看</p>
              <h3>{{ activeTruck.tractorLicensePlateNo || '未知车头' }}</h3>
              <p class="detail-copy">
                先查看核心车辆字段，再打开 AI 助手生成可控的摘要和风险提示。
              </p>
            </div>

            <el-button type="primary" :loading="aiLoading" @click="handleOpenAiAssist">
              AI 助手
            </el-button>
          </div>

          <div class="detail-grid">
            <article class="detail-card">
              <span>挂车牌照</span>
              <strong>{{ activeTruck.trailerLicensePlateNo || '-' }}</strong>
            </article>
            <article class="detail-card">
              <span>车辆类型</span>
              <strong>{{ formatTruckType(activeTruck.truckType) }}</strong>
            </article>
            <article class="detail-card">
              <span>车辆型号</span>
              <strong>{{ activeTruck.truckModel || '-' }}</strong>
            </article>
            <article class="detail-card">
              <span>动力类型</span>
              <strong>{{ formatPowerType(activeTruck.powerType) }}</strong>
            </article>
            <article class="detail-card">
              <span>白名单</span>
              <strong>{{ formatYesNo(activeTruck.whiteTruckFlag) }}</strong>
            </article>
            <article class="detail-card">
              <span>油耗</span>
              <strong>{{ formatConsumption(activeTruck.consumption) }}</strong>
            </article>
            <article class="detail-card">
              <span>更新人</span>
              <strong>{{ activeTruck.modifyPersonName || '-' }}</strong>
            </article>
            <article class="detail-card">
              <span>更新时间</span>
              <strong>{{ formatDateTime(activeTruck.modifyTime) }}</strong>
            </article>
          </div>

          <div class="assistant-shell">
            <div class="assistant-head">
              <div>
                <p class="eyebrow">AI 助手</p>
                <h4>摘要与风险提示</h4>
              </div>

              <el-button v-if="aiResult" plain :disabled="aiLoading" @click="handleCopyAiResult">
                复制结果
              </el-button>
            </div>

            <div v-if="!aiPanelVisible" class="assistant-placeholder">
              点击“AI 助手”后，会为当前车辆记录生成简要摘要、风险点和下一步建议。
            </div>

            <div v-else-if="aiLoading" class="assistant-placeholder">正在生成 AI 分析结果...</div>

            <div v-else-if="aiError" class="assistant-error">
              {{ aiError }}
            </div>

            <div v-else-if="aiResult" class="assistant-result">
              <div class="assistant-meta">
                <span>置信度：{{ formatConfidence(aiResult.confidence) }}</span>
                <span>来源：{{ formatSource(aiResult.source) }}</span>
                <span v-if="aiResult.cached">缓存结果</span>
              </div>

              <p v-if="aiResult.notice" class="assistant-notice">{{ aiResult.notice }}</p>

              <section class="assistant-section">
                <h5>摘要</h5>
                <ul>
                  <li v-for="item in aiResult.summary" :key="item">{{ item }}</li>
                </ul>
              </section>

              <section class="assistant-section">
                <h5>风险点</h5>
                <ul>
                  <li v-for="item in aiResult.risks" :key="item">{{ item }}</li>
                </ul>
              </section>

              <section class="assistant-section">
                <h5>下一步建议</h5>
                <ul>
                  <li v-for="item in aiResult.nextActions" :key="item">{{ item }}</li>
                </ul>
              </section>
            </div>
          </div>
        </section>
      </template>
    </el-drawer>
  </section>
</template>

<style scoped>
.truck-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-head,
.page-note {
  padding: 1.5rem;
  border-radius: 28px;
  border: 1px solid rgba(29, 59, 54, 0.1);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 40px rgba(19, 35, 33, 0.08);
}

.page-head {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(220px, 0.9fr);
  gap: 1rem;
}

.eyebrow {
  color: #7a5d2d;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.76rem;
  font-weight: 700;
}

.page-head h2 {
  margin-top: 0.4rem;
  color: #173937;
  font-size: 1.7rem;
  font-weight: 700;
}

.intro {
  max-width: 42rem;
  margin-top: 0.75rem;
  color: #556260;
}

.permission-copy {
  margin-top: 0.75rem;
  color: #7a5d2d;
}

.permission-copy-granted {
  color: #1a6c45;
}

.head-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.25rem;
  border-radius: 24px;
  background: linear-gradient(180deg, #fcf2df, #f2dfbd);
}

.head-card span,
.head-card small {
  color: #7a5d2d;
}

.head-card strong {
  color: #173937;
  font-size: 2.2rem;
  font-weight: 700;
}

.error-banner {
  padding: 1rem 1.25rem;
  border-radius: 18px;
  background: rgba(245, 108, 108, 0.12);
  color: #c45656;
  border: 1px solid rgba(245, 108, 108, 0.18);
}

.page-note {
  color: #5b6663;
}

.page-note strong {
  display: block;
  margin-bottom: 0.75rem;
  color: #173937;
}

.detail-shell {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.detail-header,
.assistant-shell {
  padding: 1.25rem;
  border-radius: 24px;
  border: 1px solid rgba(29, 59, 54, 0.1);
  background: rgba(255, 255, 255, 0.9);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.detail-header h3 {
  margin-top: 0.35rem;
  color: #173937;
  font-size: 1.45rem;
  font-weight: 700;
}

.detail-copy {
  margin-top: 0.65rem;
  color: #556260;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.detail-card {
  padding: 1rem 1.1rem;
  border-radius: 20px;
  background: #f6f8f7;
}

.detail-card span {
  color: #66706d;
  font-size: 0.88rem;
}

.detail-card strong {
  display: block;
  margin-top: 0.35rem;
  color: #173937;
  font-size: 1rem;
}

.assistant-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.assistant-head h4 {
  margin-top: 0.35rem;
  color: #173937;
  font-size: 1.25rem;
  font-weight: 700;
}

.assistant-placeholder,
.assistant-error {
  margin-top: 1rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  color: #556260;
  background: #f6f8f7;
}

.assistant-error {
  color: #c45656;
  background: rgba(245, 108, 108, 0.12);
}

.assistant-result {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assistant-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  color: #7a5d2d;
  font-size: 0.88rem;
}

.assistant-notice {
  padding: 0.9rem 1rem;
  border-radius: 18px;
  background: #fcf2df;
  color: #7a5d2d;
}

.assistant-section {
  padding: 1rem 1.1rem;
  border-radius: 20px;
  background: #f6f8f7;
}

.assistant-section h5 {
  color: #173937;
  font-size: 1rem;
  font-weight: 700;
}

.assistant-section ul {
  margin-top: 0.75rem;
  padding-left: 1.1rem;
  color: #4f5a58;
  display: grid;
  gap: 0.55rem;
}

@media (max-width: 960px) {
  .page-head {
    grid-template-columns: 1fr;
  }

  .detail-header,
  .assistant-head,
  .detail-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
