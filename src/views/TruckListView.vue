<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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
import type { TruckItem, TruckListQuery } from '@/types/truck'

type TableLikeTruckRow = TruckItem & Record<string, unknown>

const { hasPermission } = usePermission()

const truckTypeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Type 1', value: 1 },
  { label: 'Type 2', value: 2 },
]

const queryFields: FormFieldSchema[] = [
  {
    key: 'truckType',
    label: 'Truck Type',
    type: 'select1',
    options: truckTypeOptions,
    defaultValue: '',
  },
  {
    key: 'tractorLicensePlateNo',
    label: 'Tractor Plate',
    type: 'input',
    defaultValue: '',
  },
  {
    key: 'trailerLicensePlateNo',
    label: 'Trailer Plate',
    type: 'input',
    defaultValue: '',
  },
  {
    key: 'isDriverLicenseExpire',
    label: 'Driver License Expired',
    type: 'switch',
    defaultValue: false,
  },
  {
    key: 'isVehicleLicenseExpire',
    label: 'Vehicle License Expired',
    type: 'switch',
    defaultValue: false,
  },
  {
    key: 'isBusinessExpire',
    label: 'Business License Expired',
    type: 'switch',
    defaultValue: false,
  },
  {
    key: 'isCompulsoryExpire',
    label: 'Compulsory Insurance Expired',
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

const columns: TableColumnSchema<TableLikeTruckRow>[] = [
  {
    key: 'index',
    label: '#',
    width: 72,
    formatter: (_row, index) => (pagination.currentPage - 1) * pagination.pageSize + index + 1,
  },
  {
    key: 'tractorLicensePlateNo',
    label: 'Tractor Plate',
    prop: 'tractorLicensePlateNo',
    minWidth: 150,
    sortable: 'custom',
  },
  {
    key: 'trailerLicensePlateNo',
    label: 'Trailer Plate',
    prop: 'trailerLicensePlateNo',
    minWidth: 150,
  },
  {
    key: 'truckType',
    label: 'Truck Type',
    prop: 'truckType',
    width: 120,
    sortable: 'custom',
    formatter: (row) => formatTruckType(row.truckType),
  },
  {
    key: 'truckModel',
    label: 'Model',
    prop: 'truckModel',
    width: 120,
  },
  {
    key: 'whiteTruckFlag',
    label: 'White List',
    prop: 'whiteTruckFlag',
    width: 96,
    formatter: (row) => formatYesNo(row.whiteTruckFlag),
  },
  {
    key: 'powerType',
    label: 'Power Type',
    prop: 'powerType',
    width: 110,
  },
  {
    key: 'modifyPersonName',
    label: 'Updated By',
    prop: 'modifyPersonName',
    width: 140,
  },
  {
    key: 'modifyTime',
    label: 'Updated At',
    prop: 'modifyTime',
    minWidth: 170,
  },
]

const batchActions = computed<TableBatchAction<TableLikeTruckRow>[]>(() =>
  hasPermission('truck:batch')
    ? [
        {
          key: 'export',
          label: 'Batch Export',
          type: 'primary',
        },
        {
          key: 'tag',
          label: 'Batch Tag',
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
    // The request layer already handles unified error feedback.
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

function formatTruckType(truckType: TruckItem['truckType']) {
  if (truckType === null) {
    return '-'
  }

  return truckType === 1 ? 'Type 1' : truckType === 2 ? 'Type 2' : String(truckType)
}

function formatYesNo(value: number | null) {
  if (value === null) {
    return '-'
  }

  return value === 1 ? 'Yes' : 'No'
}

onMounted(async () => {
  await loadTruckList()
})
</script>

<template>
  <section class="truck-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Protected Module</p>
        <h2>Truck List Practice</h2>
        <p class="intro">
          This page is restricted to the admin role at the route level. Batch operations are also
          hidden behind page-level permissions.
        </p>
        <p
          v-permission="{ permissions: 'truck:batch' }"
          class="permission-copy permission-copy-granted"
        >
          Batch actions are available for this role.
        </p>
        <p v-if="!hasPermission('truck:batch')" class="permission-copy">
          Current role can view truck records, but batch actions are hidden by permission.
        </p>
      </div>

      <div class="head-card">
        <span>Total Records</span>
        <strong>{{ pagination.total }}</strong>
        <small>Driven by backend pagination data</small>
      </div>
    </div>

    <QueryFilterForm
      v-model="queryModel"
      :fields="queryFields"
      :loading="loading"
      submit-text="Search"
      reset-text="Reset"
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
    />

    <div class="page-note">
      <strong>Permission layering</strong>
      <p>Route access is limited to `admin` via router meta.</p>
      <p>Batch buttons are controlled separately through operation permissions.</p>
      <p>
        That split is very common in admin systems: page permission first, action permission second.
      </p>
      <p>Selected rows: {{ selectedRows.length }}</p>
    </div>
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

@media (max-width: 960px) {
  .page-head {
    grid-template-columns: 1fr;
  }
}
</style>
