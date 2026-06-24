<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CrudTable from '@/components/CrudTable.vue'
import EntityForm from '@/components/EntityForm.vue'
import QueryFilterForm from '@/components/QueryFilterForm.vue'
import type { FormModel, TableColumnSchema, TablePagination } from '@/components/formSchemas'
import { useDialog } from '@/composables/useDialog'
import {
  createVehicleApi,
  deleteVehicleApi,
  fetchVehicleDetailApi,
  fetchVehiclesApi,
  generateVehicleAssistApi,
  updateVehicleApi,
} from '@/features/vehicle/api'
import {
  formatVehicleDriveType,
  formatVehicleEnergyType,
  formatVehicleStatus,
  formatVehicleType,
} from '@/features/vehicle/constants'
import {
  createVehicleFormFields,
  createVehicleFormInitialValue,
  createVehicleQueryFields,
  createVehicleQueryInitialValue,
} from '@/features/vehicle/formSchema'
import type {
  AiAssistResult,
  CreateVehiclePayload,
  UpdateVehiclePayload,
  VehicleAiAssistDto,
  VehicleItem,
  VehicleListQuery,
  VehicleQueryForm,
  VehicleSortField,
} from '@/features/vehicle/types'

type TableSortOrder = 'ascending' | 'descending' | null

const loading = ref(false)
const saving = ref(false)
const aiLoading = ref(false)
const deletingId = ref<number | null>(null)
const requestError = ref('')
const aiError = ref('')
const selectedVehicleId = ref<number | null>(null)
const aiDrawerVisible = ref(false)
const aiVehicle = ref<VehicleItem | null>(null)
const aiResult = ref<AiAssistResult | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const vehicles = ref<VehicleItem[]>([])
const queryModel = ref<VehicleQueryForm>(createVehicleQueryInitialValue())
const formModel = ref<FormModel>(createVehicleFormInitialValue())
const sortState = reactive<{
  prop: VehicleSortField | null
  order: TableSortOrder
}>({
  prop: null,
  order: null,
})

const vehicleDialog = useDialog<VehicleItem>({
  createTitle: '新增车辆',
  editTitle: '编辑车辆',
})

const queryFields = createVehicleQueryFields()
const formFields = createVehicleFormFields()

const pagination = computed<TablePagination>(() => ({
  currentPage: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  pageSizes: [10, 20, 50],
}))

const columns = computed<TableColumnSchema<VehicleItem>[]>(() => [
  {
    key: 'plateNumber',
    label: '车牌号',
    prop: 'plateNumber',
    minWidth: 140,
    sortable: 'custom',
  },
  {
    key: 'vehicleType',
    label: '车辆类型',
    prop: 'vehicleType',
    width: 120,
    formatter: (row) => formatVehicleType(row.vehicleType),
  },
  {
    key: 'driveType',
    label: '驱动形式',
    prop: 'driveType',
    width: 110,
    formatter: (row) => formatVehicleDriveType(row.driveType),
  },
  {
    key: 'energyType',
    label: '能源类型',
    prop: 'energyType',
    width: 110,
    formatter: (row) => formatVehicleEnergyType(row.energyType),
  },
  {
    key: 'brandModel',
    label: '品牌型号',
    prop: 'brandModel',
    minWidth: 150,
  },
  {
    key: 'status',
    label: '状态',
    prop: 'status',
    width: 120,
    formatter: (row) => formatVehicleStatus(row.status),
  },
  {
    key: 'updatedBy',
    label: '更新人',
    prop: 'updatedBy',
    width: 130,
  },
  {
    key: 'updatedAt',
    label: '更新时间',
    prop: 'updatedAt',
    minWidth: 180,
    sortable: 'custom',
  },
])

const isEditing = computed(
  () => vehicleDialog.mode.value === 'edit' && selectedVehicleId.value !== null,
)

function resolveErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试'
}

// 格式化 AI 分析置信度展示文本。
function formatConfidence(value: AiAssistResult['confidence']) {
  return value === 'high' ? '高' : value === 'medium' ? '中' : '低'
}

// 格式化 AI 分析来源展示文本。
function formatAiSource(value: AiAssistResult['source']) {
  if (value === 'api') {
    return 'OpenAI'
  }

  if (value === 'mock') {
    return '规则兜底'
  }

  return '降级结果'
}

// 格式化 AI 请求模式展示文本。
function formatAiRequestMode(value?: NonNullable<AiAssistResult['runtime']>['requestMode']) {
  if (value === 'cache-hit') {
    return '命中缓存'
  }

  if (value === 'force-refresh') {
    return '手动重算'
  }

  return '实时生成'
}

// 将布尔状态格式化为更直观的展示文案。
function formatBooleanState(value: boolean, truthyLabel: string, falsyLabel: string) {
  return value ? truthyLabel : falsyLabel
}

// 判断车牌号格式是否存在可疑情况。
function isSuspiciousPlateNumber(value: string) {
  return !/^[A-Z]{2}-[A-Z0-9]{5,8}$/.test(value.trim().toUpperCase())
}

// 计算距离最近更新时间已过去多少天。
function getDaysSince(value: string) {
  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    return null
  }

  const diff = Date.now() - timestamp
  return diff < 0 ? 0 : Math.floor(diff / (1000 * 60 * 60 * 24))
}

// 组装车辆列表查询参数。
function createRequestPayload(): VehicleListQuery {
  const createdAtRange = Array.isArray(queryModel.value.createdAtRange)
    ? queryModel.value.createdAtRange
    : []
  const updatedAtRange = Array.isArray(queryModel.value.updatedAtRange)
    ? queryModel.value.updatedAtRange
    : []

  return {
    plateNumber: queryModel.value.plateNumber.trim() || undefined,
    vehicleType: queryModel.value.vehicleType || undefined,
    driveType: queryModel.value.driveType || undefined,
    energyType: queryModel.value.energyType || undefined,
    status: queryModel.value.status || undefined,
    createdFrom: createdAtRange[0] || undefined,
    createdTo: createdAtRange[1] || undefined,
    updatedFrom: updatedAtRange[0] || undefined,
    updatedTo: updatedAtRange[1] || undefined,
    page: currentPage.value,
    pageSize: pageSize.value,
    sortField: sortState.prop ?? undefined,
    sortOrder:
      sortState.order === 'ascending'
        ? 'asc'
        : sortState.order === 'descending'
          ? 'desc'
          : undefined,
  }
}

// 加载车辆列表。
async function loadVehicles(options: { resetPage?: boolean } = {}) {
  loading.value = true
  requestError.value = ''

  try {
    if (options.resetPage) {
      currentPage.value = 1
    }

    const result = await fetchVehiclesApi(createRequestPayload())
    vehicles.value = result.list
    total.value = result.total
    currentPage.value = result.page
    pageSize.value = result.pageSize
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

// 根据当前车辆行构建 AI 分析请求体。
function createVehicleAssistPayload(row: VehicleItem): VehicleAiAssistDto {
  const daysSinceUpdate = getDaysSince(row.updatedAt)

  return {
    id: row.id,
    plateNumber: row.plateNumber,
    vehicleType: formatVehicleType(row.vehicleType),
    driveType: formatVehicleDriveType(row.driveType),
    energyType: formatVehicleEnergyType(row.energyType),
    brandModel: row.brandModel.trim(),
    vin: row.vin.trim(),
    axleCount: row.axleCount,
    loadCapacity: row.loadCapacity,
    status: formatVehicleStatus(row.status),
    remark: row.remark.trim(),
    updatedBy: row.updatedBy.trim(),
    updatedAt: row.updatedAt,
    flags: {
      missingVin: !row.vin.trim(),
      missingBrandModel: !row.brandModel.trim(),
      missingAxleCount: row.axleCount == null,
      missingLoadCapacity: row.loadCapacity == null,
      staleRecord: daysSinceUpdate !== null && daysSinceUpdate > 30,
      inactiveStatus: row.status === 'inactive',
      maintenanceStatus: row.status === 'maintenance',
      suspiciousPlateNumber: isSuspiciousPlateNumber(row.plateNumber),
      emptyRemark: !row.remark.trim(),
    },
    metrics: {
      loadCapacity: row.loadCapacity,
      daysSinceUpdate,
    },
  }
}

// 重置弹窗表单数据。
function resetForm() {
  selectedVehicleId.value = null
  formModel.value = createVehicleFormInitialValue()
}

// 打开 AI 分析抽屉，并优先读取数据库中的已保存结果。
async function openAiDrawer(row: VehicleItem, options: { forceRefresh?: boolean } = {}) {
  aiDrawerVisible.value = true
  aiVehicle.value = row
  aiResult.value = null
  aiError.value = ''
  aiLoading.value = true

  try {
    aiResult.value = await generateVehicleAssistApi({
      vehicle: createVehicleAssistPayload(row),
      forceRefresh: options.forceRefresh,
    })
  } catch (error) {
    aiError.value = resolveErrorMessage(error)
  } finally {
    aiLoading.value = false
  }
}

// 强制重新分析当前车辆，并覆盖数据库中的最新结果。
async function refreshAiResult() {
  if (!aiVehicle.value) {
    return
  }

  await openAiDrawer(aiVehicle.value, { forceRefresh: true })
}

// 关闭 AI 分析抽屉并清理状态。
function closeAiDrawer() {
  aiDrawerVisible.value = false
  aiVehicle.value = null
  aiResult.value = null
  aiError.value = ''
}

// 打开新增车辆弹窗。
function openCreateDialog() {
  requestError.value = ''
  resetForm()
  vehicleDialog.openCreate()
}

// 复制 AI 分析结果，方便演示展示。
async function copyAiResult() {
  if (!aiResult.value) {
    return
  }

  const content = [
    'AI 摘要',
    ...aiResult.value.summary.map((item, index) => `${index + 1}. ${item}`),
    '',
    '异常与风险提示',
    ...aiResult.value.risks.map((item, index) => `${index + 1}. ${item}`),
    '',
    '下一步建议',
    ...aiResult.value.nextActions.map((item, index) => `${index + 1}. ${item}`),
  ].join('\n')

  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('AI 分析结果已复制')
  } catch {
    ElMessage.error('复制失败，请稍后重试')
  }
}

// 打开编辑弹窗并加载车辆详情。
async function openEditDialog(row: VehicleItem) {
  loading.value = true
  requestError.value = ''

  try {
    const detail = await fetchVehicleDetailApi(row.id)
    selectedVehicleId.value = detail.id
    formModel.value = createVehicleFormInitialValue(detail)
    vehicleDialog.openEdit(detail)
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

// 关闭弹窗并清理表单状态。
function closeDialog() {
  vehicleDialog.close()
  resetForm()
}

// 将表单模型转换为提交参数。
function buildSubmitPayload(model: FormModel): CreateVehiclePayload {
  return {
    plateNumber: String(model.plateNumber ?? '')
      .trim()
      .toUpperCase(),
    vehicleType: model.vehicleType as CreateVehiclePayload['vehicleType'],
    driveType: model.driveType as CreateVehiclePayload['driveType'],
    energyType: model.energyType as CreateVehiclePayload['energyType'],
    brandModel: String(model.brandModel ?? '').trim(),
    vin: String(model.vin ?? '')
      .trim()
      .toUpperCase(),
    axleCount:
      model.axleCount === null || model.axleCount === undefined || model.axleCount === ''
        ? null
        : Number(model.axleCount),
    loadCapacity:
      model.loadCapacity === null || model.loadCapacity === undefined || model.loadCapacity === ''
        ? null
        : Number(model.loadCapacity),
    status: model.status as CreateVehiclePayload['status'],
    remark: String(model.remark ?? '').trim(),
  }
}

// 提交新增或编辑表单。
async function handleSubmit(model: FormModel) {
  saving.value = true
  requestError.value = ''

  try {
    const payload = buildSubmitPayload(model)

    if (isEditing.value) {
      await updateVehicleApi(selectedVehicleId.value as number, payload as UpdateVehiclePayload)
      ElMessage.success('车辆更新成功')
    } else {
      await createVehicleApi(payload)
      ElMessage.success('车辆新增成功')
    }

    closeDialog()
    await loadVehicles()
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    saving.value = false
  }
}

// 删除指定车辆记录。
async function handleDelete(row: VehicleItem) {
  await ElMessageBox.confirm(`确认删除车辆“${row.plateNumber}”吗？`, '删除车辆', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
  })

  deletingId.value = row.id
  requestError.value = ''

  try {
    await deleteVehicleApi(row.id)
    ElMessage.success('车辆删除成功')
    await loadVehicles()
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    deletingId.value = null
  }
}

// 按当前条件查询列表。
async function handleSearch() {
  await loadVehicles({ resetPage: true })
}

// 重置筛选条件并刷新列表。
async function handleReset() {
  queryModel.value = createVehicleQueryInitialValue()
  sortState.prop = null
  sortState.order = null
  await loadVehicles({ resetPage: true })
}

// 切换分页页码。
function handlePageChange(page: number) {
  currentPage.value = page
  void loadVehicles()
}

// 切换每页条数。
function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  void loadVehicles()
}

// 同步表格排序状态。
function handleSortChange(payload: {
  prop: string | null
  order: 'ascending' | 'descending' | null
}) {
  sortState.prop = payload.order ? (payload.prop as VehicleSortField | null) : null
  sortState.order = payload.order
  void loadVehicles()
}

void loadVehicles()
</script>

<template>
  <section class="vehicle-page">
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

    <div class="head-actions">
      <el-button :loading="loading" @click="loadVehicles({ resetPage: true })">刷新</el-button>
      <el-button type="primary" @click="openCreateDialog">新增车辆</el-button>
    </div>

    <CrudTable
      :rows="vehicles"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      :selection-enabled="false"
      empty-text="暂无车辆数据"
      operation-label="操作"
      :operation-width="160"
      @sort-change="handleSortChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #operation="{ row }">
        <el-button link type="primary" @click.stop="openEditDialog(row)">编辑</el-button>
        <el-button link type="warning" @click.stop="openAiDrawer(row)">AI 分析</el-button>
        <el-button
          link
          type="danger"
          :loading="deletingId === row.id"
          @click.stop="handleDelete(row)"
        >
          删除
        </el-button>
      </template>
    </CrudTable>

    <el-dialog
      v-model="vehicleDialog.visible.value"
      :title="vehicleDialog.title.value"
      width="720px"
      destroy-on-close
      @closed="closeDialog"
    >
      <EntityForm
        v-model="formModel"
        :fields="formFields"
        :initial-value="formModel"
        :loading="saving"
        :columns="2"
        :submit-text="isEditing ? '保存修改' : '新增车辆'"
        cancel-text="取消"
        @submit="handleSubmit"
        @cancel="closeDialog"
      />
    </el-dialog>

    <el-drawer
      v-model="aiDrawerVisible"
      title="车辆 AI 摘要与异常识别"
      size="720px"
      destroy-on-close
      @closed="closeAiDrawer"
    >
      <section v-if="aiVehicle" class="ai-shell">
        <div class="ai-head-card">
          <div>
            <p class="eyebrow">AI 助手</p>
            <h3>{{ aiVehicle.plateNumber }}</h3>
            <p class="intro">
              基于当前车辆档案自动生成摘要、异常录入提示和下一步建议，方便在面试中演示 AI
              与业务数据的结合。
            </p>
          </div>

          <div class="ai-head-actions">
            <el-button :loading="aiLoading" @click="refreshAiResult">重新分析</el-button>
            <el-button
              type="primary"
              plain
              :disabled="!aiResult || aiLoading"
              @click="copyAiResult"
            >
              复制结果
            </el-button>
          </div>
        </div>

        <div class="ai-detail-grid">
          <article class="ai-detail-card">
            <span>车辆类型</span>
            <strong>{{ formatVehicleType(aiVehicle.vehicleType) }}</strong>
          </article>
          <article class="ai-detail-card">
            <span>驱动形式</span>
            <strong>{{ formatVehicleDriveType(aiVehicle.driveType) }}</strong>
          </article>
          <article class="ai-detail-card">
            <span>能源类型</span>
            <strong>{{ formatVehicleEnergyType(aiVehicle.energyType) }}</strong>
          </article>
          <article class="ai-detail-card">
            <span>状态</span>
            <strong>{{ formatVehicleStatus(aiVehicle.status) }}</strong>
          </article>
          <article class="ai-detail-card">
            <span>品牌型号</span>
            <strong>{{ aiVehicle.brandModel || '-' }}</strong>
          </article>
          <article class="ai-detail-card">
            <span>更新人</span>
            <strong>{{ aiVehicle.updatedBy || '-' }}</strong>
          </article>
        </div>

        <div v-if="aiLoading" class="ai-placeholder">正在生成车辆 AI 分析结果...</div>
        <div v-else-if="aiError" class="ai-error">{{ aiError }}</div>

        <div v-else-if="aiResult" class="ai-result">
          <div class="ai-meta">
            <span>置信度：{{ formatConfidence(aiResult.confidence) }}</span>
            <span>来源：{{ formatAiSource(aiResult.source) }}</span>
            <span v-if="aiResult.cached">缓存结果</span>
            <span>生成时间：{{ aiResult.generatedAt }}</span>
          </div>

          <p v-if="aiResult.notice" class="ai-notice">{{ aiResult.notice }}</p>

          <section v-if="aiResult.runtime" class="ai-runtime-card">
            <div class="ai-runtime-head">
              <h4>AI 运行状态</h4>
              <span>{{ formatAiRequestMode(aiResult.runtime.requestMode) }}</span>
            </div>

            <div class="ai-runtime-grid">
              <article class="ai-runtime-item">
                <span>服务提供方</span>
                <strong>{{ aiResult.runtime.provider }}</strong>
              </article>
              <article class="ai-runtime-item">
                <span>模型</span>
                <strong>{{ aiResult.runtime.model }}</strong>
              </article>
              <article class="ai-runtime-item">
                <span>缓存层</span>
                <strong>{{ aiResult.runtime.cacheLayer }}</strong>
              </article>
              <article class="ai-runtime-item">
                <span>超时设置</span>
                <strong>{{ aiResult.runtime.timeoutMs }} ms</strong>
              </article>
              <article class="ai-runtime-item">
                <span>结果持久化</span>
                <strong>{{ formatBooleanState(true, '已开启', '未开启') }}</strong>
              </article>
              <article class="ai-runtime-item">
                <span>Store 开关</span>
                <strong>
                  {{ formatBooleanState(aiResult.runtime.storeEnabled, '已开启', '未开启') }}
                </strong>
              </article>
              <article class="ai-runtime-item">
                <span>API Key</span>
                <strong>
                  {{ formatBooleanState(aiResult.runtime.apiKeyConfigured, '已配置', '未配置') }}
                </strong>
              </article>
              <article class="ai-runtime-item">
                <span>建议刷新</span>
                <strong>
                  {{
                    formatBooleanState(
                      aiResult.runtime.refreshRecommended,
                      '建议重新分析',
                      '当前结果可直接使用',
                    )
                  }}
                </strong>
              </article>
            </div>

            <p class="ai-runtime-tip">当前接口地址：{{ aiResult.runtime.endpointLabel }}</p>
          </section>

          <section class="ai-panel">
            <h4>AI 摘要</h4>
            <ul>
              <li v-for="item in aiResult.summary" :key="item">{{ item }}</li>
            </ul>
          </section>

          <section class="ai-panel">
            <h4>异常与风险提示</h4>
            <ul>
              <li v-for="item in aiResult.risks" :key="item">{{ item }}</li>
            </ul>
          </section>

          <section class="ai-panel">
            <h4>下一步建议</h4>
            <ul>
              <li v-for="item in aiResult.nextActions" :key="item">{{ item }}</li>
            </ul>
          </section>
        </div>
      </section>
    </el-drawer>
  </section>
</template>

<style scoped lang="less">
.vehicle-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  .error-banner {
    padding: 1rem 1.2rem;
    border: 1px solid rgba(248, 113, 113, 0.2);
    border-radius: 18px;
    background: rgba(248, 113, 113, 0.08);
    color: #dc2626;
  }
}

.ai-shell {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .ai-head-card,
  .ai-panel,
  .ai-detail-card,
  .ai-runtime-card {
    border: 1px solid rgba(29, 59, 54, 0.08);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.92);
  }

  .ai-head-card {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;

    h3 {
      margin-top: 0.35rem;
      color: #173937;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .ai-head-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  }

  .ai-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;

    .ai-detail-card {
      padding: 1rem 1.1rem;
      background: #f6f8f7;

      span {
        color: #66706d;
        font-size: 0.88rem;
      }

      strong {
        display: block;
        margin-top: 0.35rem;
        color: #173937;
        font-size: 1rem;
      }
    }
  }

  .ai-placeholder,
  .ai-error,
  .ai-notice {
    padding: 1rem 1.1rem;
    border-radius: 18px;
  }

  .ai-placeholder {
    background: #f6f8f7;
    color: #556260;
  }

  .ai-error {
    background: rgba(245, 108, 108, 0.12);
    color: #c45656;
  }

  .ai-result {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .ai-runtime-card {
    padding: 1rem 1.1rem;
    background: linear-gradient(135deg, #f5f7f2 0%, #fffdf7 100%);

    .ai-runtime-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;

      h4 {
        color: #173937;
        font-size: 1rem;
        font-weight: 700;
      }

      span {
        color: #7a5d2d;
        font-size: 0.88rem;
        font-weight: 600;
      }
    }

    .ai-runtime-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.85rem;
      margin-top: 0.9rem;

      .ai-runtime-item {
        padding: 0.9rem 1rem;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.92);

        span {
          color: #66706d;
          font-size: 0.82rem;
        }

        strong {
          display: block;
          margin-top: 0.32rem;
          color: #173937;
          font-size: 0.95rem;
          line-height: 1.4;
          word-break: break-word;
        }
      }
    }

    .ai-runtime-tip {
      margin-top: 0.9rem;
      color: #556260;
      font-size: 0.86rem;
      line-height: 1.6;
      word-break: break-all;
    }
  }

  .ai-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    color: #7a5d2d;
    font-size: 0.88rem;
  }

  .ai-notice {
    background: #fcf2df;
    color: #7a5d2d;
  }

  .ai-panel {
    padding: 1rem 1.1rem;
    background: #f6f8f7;

    h4 {
      color: #173937;
      font-size: 1rem;
      font-weight: 700;
    }

    ul {
      margin-top: 0.75rem;
      padding-left: 1.15rem;
      color: #4f5a58;
      display: grid;
      gap: 0.55rem;
    }
  }
}

@media (max-width: 980px) {
  .vehicle-page {
    .page-head {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .ai-shell {
    .ai-head-card,
    .ai-detail-grid,
    .ai-runtime-card .ai-runtime-grid {
      flex-direction: column;
      grid-template-columns: 1fr;
    }
  }
}
</style>
