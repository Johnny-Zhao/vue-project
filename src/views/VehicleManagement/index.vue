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
  CreateVehiclePayload,
  UpdateVehiclePayload,
  VehicleItem,
  VehicleListQuery,
  VehicleQueryForm,
  VehicleSortField,
} from '@/features/vehicle/types'

type TableSortOrder = 'ascending' | 'descending' | null

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const requestError = ref('')
const selectedVehicleId = ref<number | null>(null)
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

// 重置弹窗表单数据。
function resetForm() {
  selectedVehicleId.value = null
  formModel.value = createVehicleFormInitialValue()
}

// 打开新增车辆弹窗。
function openCreateDialog() {
  requestError.value = ''
  resetForm()
  vehicleDialog.openCreate()
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
    <div class="page-head">
      <div>
        <p class="eyebrow">车辆档案</p>
        <h2>车辆管理</h2>
        <p class="intro">
          维护车辆基础资料，支持查询、增删改查、审计留痕，并为后续 AI 分析能力预留数据基础。
        </p>
      </div>

      <div class="head-actions">
        <el-button :loading="loading" @click="loadVehicles({ resetPage: true })">刷新</el-button>
        <el-button type="primary" @click="openCreateDialog">新增车辆</el-button>
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
  </section>
</template>

<style scoped lang="less">
.vehicle-page {
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

@media (max-width: 980px) {
  .vehicle-page {
    .page-head {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>
