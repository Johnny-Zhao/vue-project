<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { RequestError } from '@/api/request'
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
  submitVehicleAiFeedbackApi,
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
  VehicleAiFeedbackType,
  VehicleItem,
  VehicleListQuery,
  VehicleQueryForm,
  VehicleSortField,
} from '@/features/vehicle/types'

type TableSortOrder = 'ascending' | 'descending' | null

const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const aiLoading = ref(false)
const feedbackSubmitting = ref<VehicleAiFeedbackType | null>(null)
const deletingId = ref<number | null>(null)
const requestError = ref('')
const aiError = ref('')
const aiErrorCode = ref<string | number | null>(null)
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

// 统一生成分页配置，供公共表格组件复用。
const pagination = computed<TablePagination>(() => ({
  currentPage: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  pageSizes: [10, 20, 50],
}))

// 组装车辆列表列定义。
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

// 判断当前弹窗是否处于编辑模式。
const isEditing = computed(
  () => vehicleDialog.mode.value === 'edit' && selectedVehicleId.value !== null,
)

// 统一提取请求错误文案。
function resolveErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试'
}

// 提取请求中的业务错误码，供 AI 失败态展示使用。
function resolveErrorCode(error: unknown) {
  return error instanceof RequestError ? (error.errorCode ?? null) : null
}

// 生成 AI 失败态引导文案。
function resolveAiErrorActionText() {
  if (aiErrorCode.value === 'AI_NO_API_KEY') {
    return '前往 AI 配置页'
  }

  if (aiErrorCode.value === 'AI_MANUAL_REFRESH_DISABLED') {
    return '前往 AI 配置页'
  }

  if (
    aiErrorCode.value === 'AI_RATE_LIMITED' ||
    aiErrorCode.value === 'AI_TIMEOUT' ||
    aiErrorCode.value === 'AI_NETWORK_ERROR' ||
    aiErrorCode.value === 'AI_PROVIDER_UNAVAILABLE' ||
    aiErrorCode.value === 'AI_PROVIDER_ERROR' ||
    aiErrorCode.value === 'AI_EMPTY_OUTPUT' ||
    aiErrorCode.value === 'AI_INVALID_OUTPUT'
  ) {
    return '重新分析'
  }

  return ''
}

// 判断当前失败态是否适合跳转到 AI 配置页。
function shouldGoAiConfig() {
  return aiErrorCode.value === 'AI_NO_API_KEY' || aiErrorCode.value === 'AI_MANUAL_REFRESH_DISABLED'
}

// 判断当前失败态是否适合再次重试分析。
function shouldRetryAiAnalysis() {
  return (
    aiErrorCode.value === 'AI_RATE_LIMITED' ||
    aiErrorCode.value === 'AI_TIMEOUT' ||
    aiErrorCode.value === 'AI_NETWORK_ERROR' ||
    aiErrorCode.value === 'AI_PROVIDER_UNAVAILABLE' ||
    aiErrorCode.value === 'AI_PROVIDER_ERROR' ||
    aiErrorCode.value === 'AI_EMPTY_OUTPUT' ||
    aiErrorCode.value === 'AI_INVALID_OUTPUT'
  )
}

// 提供失败态下的下一步引导动作。
async function handleAiErrorAction() {
  if (shouldGoAiConfig()) {
    await router.push({ name: 'aiConfigManagement' })
    return
  }

  if (shouldRetryAiAnalysis() && aiVehicle.value) {
    await openAiDrawer(aiVehicle.value, { forceRefresh: true })
  }
}

// 为不同 AI 结果状态生成更直观的页面提示。
function resolveAiStatusTone() {
  const runtime = aiResult.value?.runtime

  if (!runtime) {
    return 'info'
  }

  if (runtime.resultStatus === 'api-success') {
    return 'success'
  }

  if (runtime.resultStatus === 'cache-hit') {
    return runtime.refreshRecommended ? 'warning' : 'info'
  }

  if (runtime.resultStatus === 'last-success-fallback') {
    return 'warning'
  }

  return 'danger'
}

// 为不同 AI 结果状态生成概括标题。
function resolveAiStatusTitle() {
  const runtime = aiResult.value?.runtime

  if (!runtime) {
    return ''
  }

  if (runtime.resultStatus === 'api-success') {
    return '当前展示的是最新实时生成结果'
  }

  if (runtime.resultStatus === 'cache-hit') {
    return runtime.refreshRecommended
      ? '当前展示的是历史结果，建议重新分析'
      : '当前展示的是已保存的历史结果'
  }

  if (runtime.resultStatus === 'last-success-fallback') {
    return '本次分析失败，已回退到最近一次成功结果'
  }

  if (runtime.resultStatus === 'mock-generated') {
    return '当前展示的是规则生成结果'
  }

  if (runtime.resultStatus === 'rule-fallback') {
    return '当前展示的是降级兜底结果'
  }

  return '当前展示的是 AI 分析结果'
}

// 为不同 AI 结果状态生成操作建议。
function resolveAiStatusDescription() {
  const runtime = aiResult.value?.runtime

  if (!runtime) {
    return ''
  }

  if (runtime.resultStatus === 'api-success') {
    return '可以直接用于演示 AI 对车辆档案的摘要和异常识别能力。'
  }

  if (runtime.resultStatus === 'cache-hit') {
    return runtime.refreshRecommended
      ? '车辆档案已经发生变化，建议点击“重新分析”刷新结论。'
      : '当前缓存仍可直接使用，适合快速演示。'
  }

  if (runtime.resultStatus === 'last-success-fallback') {
    return '当前结果仍可用于展示，但建议在服务恢复后重新分析。'
  }

  if (runtime.resultStatus === 'mock-generated') {
    return '这是无 Key 场景下的规则结果，适合演示降级设计。'
  }

  return '当前结果来自规则兜底，建议排查 AI 配置或服务状态。'
}

// 格式化 AI 置信度展示。
function formatConfidence(value: AiAssistResult['confidence']) {
  return value === 'high' ? '高' : value === 'medium' ? '中' : '低'
}

// 格式化 AI 来源展示。
function formatAiSource(value: AiAssistResult['source']) {
  if (value === 'api') {
    return 'OpenAI'
  }

  if (value === 'mock') {
    return '规则结果'
  }

  return '降级结果'
}

// 格式化 AI 请求模式展示。
function formatAiRequestMode(value?: NonNullable<AiAssistResult['runtime']>['requestMode']) {
  if (value === 'cache-hit') {
    return '命中缓存'
  }

  if (value === 'force-refresh') {
    return '手动重算'
  }

  return '实时生成'
}

// 格式化 AI 最终结果状态。
function formatAiResultStatus(value?: NonNullable<AiAssistResult['runtime']>['resultStatus']) {
  if (value === 'api-success') {
    return '实时生成成功'
  }

  if (value === 'cache-hit') {
    return '命中历史结果'
  }

  if (value === 'mock-generated') {
    return '规则结果'
  }

  if (value === 'last-success-fallback') {
    return '回退最近成功结果'
  }

  if (value === 'rule-fallback') {
    return '规则降级结果'
  }

  return '未知状态'
}

// 格式化 AI 失败原因码。
function formatAiFailureCode(value?: NonNullable<AiAssistResult['runtime']>['failureCode']) {
  if (value === 'AI_NO_API_KEY') {
    return '未配置 API Key'
  }

  if (value === 'AI_TIMEOUT') {
    return 'AI 请求超时'
  }

  if (value === 'AI_PROVIDER_ERROR') {
    return 'AI 服务异常'
  }

  if (value === 'AI_EMPTY_OUTPUT') {
    return 'AI 返回为空'
  }

  if (value === 'AI_INVALID_OUTPUT') {
    return 'AI 输出不可解析'
  }

  if (value === 'AI_SAVE_FAILED') {
    return '分析结果保存失败'
  }

  if (value === 'AI_MANUAL_REFRESH_DISABLED') {
    return '手动重算已关闭'
  }

  return value || '-'
}

// 统一格式化布尔状态文案。
function formatBooleanState(value: boolean, truthyLabel: string, falsyLabel: string) {
  return value ? truthyLabel : falsyLabel
}

// 判断车牌号格式是否可疑。
function isSuspiciousPlateNumber(value: string) {
  return !/^[A-Z]{2}-[A-Z0-9]{5,8}$/.test(value.trim().toUpperCase())
}

// 计算距离上次更新时间已过去多少天。
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
  aiErrorCode.value = null
  aiLoading.value = true

  try {
    aiResult.value = await generateVehicleAssistApi({
      vehicle: createVehicleAssistPayload(row),
      forceRefresh: options.forceRefresh,
    })
  } catch (error) {
    aiError.value = resolveErrorMessage(error)
    aiErrorCode.value = resolveErrorCode(error)
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

// 关闭 AI 抽屉并清理状态。
function closeAiDrawer() {
  aiDrawerVisible.value = false
  aiVehicle.value = null
  aiResult.value = null
  aiError.value = ''
  aiErrorCode.value = null
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

// 提交 AI 结果反馈，形成“分析后有人评价”的业务闭环。
async function submitAiFeedback(feedbackType: VehicleAiFeedbackType) {
  if (!aiVehicle.value || feedbackSubmitting.value) {
    return
  }

  feedbackSubmitting.value = feedbackType

  try {
    await submitVehicleAiFeedbackApi({
      vehicleId: aiVehicle.value.id,
      feedbackType,
    })

    const successText =
      feedbackType === 'helpful'
        ? '已记录“有帮助”反馈'
        : feedbackType === 'inaccurate'
          ? '已记录“不准确”反馈'
          : '已记录“需重试”反馈'

    ElMessage.success(successText)
  } catch (error) {
    ElMessage.error(resolveErrorMessage(error))
  } finally {
    feedbackSubmitting.value = null
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
        <div v-else-if="aiError" class="ai-error">
          <p>{{ aiError }}</p>
          <p v-if="aiErrorCode" class="ai-error-code">失败原因码：{{ aiErrorCode }}</p>
          <div v-if="resolveAiErrorActionText()" class="ai-error-actions">
            <el-button size="small" type="primary" @click="handleAiErrorAction">
              {{ resolveAiErrorActionText() }}
            </el-button>
          </div>
        </div>

        <div v-else-if="aiResult" class="ai-result">
          <div class="ai-meta">
            <span>置信度：{{ formatConfidence(aiResult.confidence) }}</span>
            <span>来源：{{ formatAiSource(aiResult.source) }}</span>
            <span v-if="aiResult.cached">已命中缓存</span>
            <span>生成时间：{{ aiResult.generatedAt }}</span>
          </div>

          <p v-if="aiResult.notice" class="ai-notice">{{ aiResult.notice }}</p>

          <section
            v-if="aiResult.runtime"
            class="ai-status-banner"
            :class="`ai-status-banner--${resolveAiStatusTone()}`"
          >
            <strong>{{ resolveAiStatusTitle() }}</strong>
            <span>{{ resolveAiStatusDescription() }}</span>
            <div class="ai-status-actions">
              <el-button
                v-if="aiResult.runtime.refreshRecommended"
                size="small"
                type="primary"
                @click="refreshAiResult"
              >
                重新分析
              </el-button>
              <el-button
                v-if="aiResult.runtime.failureCode === 'AI_NO_API_KEY'"
                size="small"
                plain
                @click="router.push({ name: 'aiConfigManagement' })"
              >
                前往 AI 配置页
              </el-button>
            </div>
          </section>

          <section v-if="aiResult.runtime" class="ai-runtime-card">
            <div class="ai-runtime-head">
              <h4>AI 运行状态</h4>
              <span>{{ formatAiRequestMode(aiResult.runtime.requestMode) }}</span>
            </div>

            <div class="ai-runtime-grid">
              <article class="ai-runtime-item">
                <span>结果状态</span>
                <strong>{{ formatAiResultStatus(aiResult.runtime.resultStatus) }}</strong>
              </article>
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
                <span>降级状态</span>
                <strong>{{
                  formatBooleanState(aiResult.runtime.degraded, '已降级', '正常结果')
                }}</strong>
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
              <article v-if="aiResult.runtime.failureCode" class="ai-runtime-item">
                <span>失败原因码</span>
                <strong>{{ formatAiFailureCode(aiResult.runtime.failureCode) }}</strong>
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

          <section class="ai-feedback-panel">
            <div class="ai-feedback-copy">
              <h4>AI 结果反馈</h4>
              <p>把这次分析的使用体验记录下来，方便后续持续优化提示词和降级策略。</p>
            </div>

            <div class="ai-feedback-actions">
              <el-button
                size="small"
                :loading="feedbackSubmitting === 'helpful'"
                @click="submitAiFeedback('helpful')"
              >
                有帮助
              </el-button>
              <el-button
                size="small"
                :loading="feedbackSubmitting === 'inaccurate'"
                @click="submitAiFeedback('inaccurate')"
              >
                不准确
              </el-button>
              <el-button
                size="small"
                type="primary"
                plain
                :loading="feedbackSubmitting === 'retry'"
                @click="submitAiFeedback('retry')"
              >
                需重试
              </el-button>
            </div>
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

  .head-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

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
  .ai-runtime-card,
  .ai-status-banner {
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

    .intro {
      max-width: 32rem;
      margin-top: 0.65rem;
      color: #556260;
      line-height: 1.7;
    }

    .ai-head-actions {
      display: flex;
      gap: 0.75rem;
    }
  }

  .eyebrow {
    color: #7a5d2d;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
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

    .ai-error-code {
      margin-top: 0.45rem;
      color: #9f1239;
      font-size: 0.82rem;
    }

    .ai-error-actions {
      margin-top: 0.75rem;
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }
  }

  .ai-result {
    display: flex;
    flex-direction: column;
    gap: 1rem;
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

  .ai-status-banner {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 1rem 1.1rem;

    strong {
      color: #173937;
      font-size: 1rem;
      font-weight: 700;
    }

    span {
      color: #556260;
      line-height: 1.65;
    }

    .ai-status-actions {
      display: flex;
      gap: 0.6rem;
    }

    &--success {
      background: rgba(16, 185, 129, 0.08);
      border-color: rgba(16, 185, 129, 0.22);
    }

    &--info {
      background: rgba(59, 130, 246, 0.08);
      border-color: rgba(59, 130, 246, 0.2);
    }

    &--warning {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.24);
    }

    &--danger {
      background: rgba(239, 68, 68, 0.08);
      border-color: rgba(239, 68, 68, 0.22);
    }
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

  .ai-feedback-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.1rem;
    border: 1px dashed rgba(122, 93, 45, 0.28);
    border-radius: 18px;
    background: rgba(252, 242, 223, 0.38);

    .ai-feedback-copy {
      h4 {
        color: #173937;
        font-size: 1rem;
        font-weight: 700;
      }

      p {
        margin-top: 0.45rem;
        color: #556260;
        line-height: 1.6;
      }
    }

    .ai-feedback-actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
      flex-shrink: 0;
    }
  }
}

@media (max-width: 980px) {
  .ai-shell {
    .ai-head-card,
    .ai-detail-grid,
    .ai-feedback-panel,
    .ai-runtime-card .ai-runtime-grid {
      flex-direction: column;
      grid-template-columns: 1fr;
    }
  }
}
</style>
