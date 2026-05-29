<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchTruckListApi } from '@/api/truck'
import { useRequest } from '@/composables/useRequest'
import type { TruckItem, TruckListQuery } from '@/types/truck'

function createDefaultQuery(): TruckListQuery {
  return {
    truckType: '',
    tractorLicensePlateNo: '',
    trailerLicensePlateNo: '',
    pageIndex: 0,
    pageSize: 50,
    isDriverLicenseExpire: false,
    isVehicleLicenseExpire: false,
    isBusinessExpire: false,
    isCompulsoryExpire: false,
  }
}

const queryForm = reactive<TruckListQuery>(createDefaultQuery())

const truckTypeOptions: Array<{ label: string; value: TruckListQuery['truckType'] }> = [
  { label: 'All Types', value: '' },
  { label: 'Type 1', value: 1 },
  { label: 'Type 2', value: 2 },
]

const { data, loading, error, run, clearError } = useRequest(fetchTruckListApi)

const tableRows = computed<TruckItem[]>(() => data.value?.list ?? [])
const total = computed(() => data.value?.total ?? 0)

const currentPage = computed({
  get: () => queryForm.pageIndex + 1,
  set: (nextPage: number) => {
    queryForm.pageIndex = Math.max(0, nextPage - 1)
  },
})

async function loadTruckList() {
  try {
    clearError()
    await run({ ...queryForm })
  } catch {
    ElMessage.error('Failed to load truck list. Check API and proxy config.')
  }
}

async function handleSearch() {
  queryForm.pageIndex = 0
  await loadTruckList()
}

async function handleReset() {
  Object.assign(queryForm, createDefaultQuery())
  await loadTruckList()
}

async function handleCurrentChange(page: number) {
  currentPage.value = page
  await loadTruckList()
}

async function handleSizeChange(size: number) {
  queryForm.pageSize = size
  queryForm.pageIndex = 0
  await loadTruckList()
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

function formatText(value: string | number | null) {
  if (value === null || value === '') {
    return '-'
  }

  return String(value)
}

function getRowIndex(index: number) {
  return queryForm.pageIndex * queryForm.pageSize + index + 1
}

onMounted(async () => {
  await loadTruckList()
})
</script>

<template>
  <section class="truck-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Real API Demo</p>
        <h2>Truck List Practice</h2>
        <p class="intro">
          This page connects a real API with a query form, table, and pagination.
        </p>
      </div>

      <div class="head-card">
        <span>Total Records</span>
        <strong>{{ total }}</strong>
        <small>Directly driven by backend total</small>
      </div>
    </div>

    <article class="query-panel">
      <div class="panel-head">
        <div>
          <p class="panel-label">Query Form</p>
          <h3>Keep request params aligned with page state</h3>
        </div>
      </div>

      <el-form :model="queryForm" label-position="top" class="query-form">
        <div class="form-grid">
          <el-form-item label="Truck Type">
            <el-select v-model="queryForm.truckType" placeholder="Select truck type" clearable>
              <el-option
                v-for="item in truckTypeOptions"
                :key="String(item.value)"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Tractor Plate">
            <el-input
              v-model="queryForm.tractorLicensePlateNo"
              placeholder="Enter tractor plate"
              clearable
            />
          </el-form-item>

          <el-form-item label="Trailer Plate">
            <el-input
              v-model="queryForm.trailerLicensePlateNo"
              placeholder="Enter trailer plate"
              clearable
            />
          </el-form-item>
        </div>

        <div class="switch-grid">
          <el-checkbox v-model="queryForm.isDriverLicenseExpire">Driver License Expired</el-checkbox>
          <el-checkbox v-model="queryForm.isVehicleLicenseExpire">Vehicle License Expired</el-checkbox>
          <el-checkbox v-model="queryForm.isBusinessExpire">Business License Expired</el-checkbox>
          <el-checkbox v-model="queryForm.isCompulsoryExpire">Compulsory Insurance Expired</el-checkbox>
        </div>

        <div class="actions">
          <el-button @click="handleReset">Reset</el-button>
          <el-button type="primary" :loading="loading" @click="handleSearch">Search</el-button>
        </div>
      </el-form>
    </article>

    <article class="table-panel">
      <div class="panel-head">
        <div>
          <p class="panel-label">Table Result</p>
          <h3>Drive the table with real backend data</h3>
        </div>
        <p class="error-text" v-if="error">{{ error }}</p>
      </div>

      <el-table :data="tableRows" border stripe v-loading="loading" class="truck-table">
        <el-table-column label="#" width="72">
          <template #default="{ $index }">
            {{ getRowIndex($index) }}
          </template>
        </el-table-column>

        <el-table-column prop="tractorLicensePlateNo" label="Tractor Plate" min-width="150">
          <template #default="{ row }">
            {{ formatText(row.tractorLicensePlateNo) }}
          </template>
        </el-table-column>

        <el-table-column prop="trailerLicensePlateNo" label="Trailer Plate" min-width="150">
          <template #default="{ row }">
            {{ formatText(row.trailerLicensePlateNo) }}
          </template>
        </el-table-column>

        <el-table-column prop="truckType" label="Truck Type" width="110">
          <template #default="{ row }">
            {{ formatTruckType(row.truckType) }}
          </template>
        </el-table-column>

        <el-table-column prop="truckModel" label="Model" width="120">
          <template #default="{ row }">
            {{ formatText(row.truckModel) }}
          </template>
        </el-table-column>

        <el-table-column prop="whiteTruckFlag" label="White List" width="90">
          <template #default="{ row }">
            {{ formatYesNo(row.whiteTruckFlag) }}
          </template>
        </el-table-column>

        <el-table-column prop="powerType" label="Power Type" width="100">
          <template #default="{ row }">
            {{ formatText(row.powerType) }}
          </template>
        </el-table-column>

        <el-table-column prop="modifyPersonName" label="Updated By" width="120">
          <template #default="{ row }">
            {{ formatText(row.modifyPersonName) }}
          </template>
        </el-table-column>

        <el-table-column prop="modifyTime" label="Updated At" min-width="170">
          <template #default="{ row }">
            {{ formatText(row.modifyTime) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="queryForm.pageSize"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </article>
  </section>
</template>

<style scoped>
.truck-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-head,
.query-panel,
.table-panel {
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

.eyebrow,
.panel-label {
  color: #7a5d2d;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.76rem;
  font-weight: 700;
}

.page-head h2,
.panel-head h3 {
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

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.query-form {
  margin-top: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.switch-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  margin-top: 0.5rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.error-text {
  color: #c45656;
}

.truck-table {
  margin-top: 1rem;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

@media (max-width: 960px) {
  .page-head,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .panel-head,
  .actions {
    flex-direction: column;
  }

  .pagination-wrap {
    justify-content: stretch;
  }
}
</style>
