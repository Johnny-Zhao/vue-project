<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import type { TableBatchAction, TableColumnSchema, TablePagination } from './formSchemas'

type TableRow = Record<string, unknown>

const slots = useSlots()

const props = withDefaults(
  defineProps<{
    rows: TableRow[]
    columns: TableColumnSchema<any>[]
    loading?: boolean
    rowKey?: string
    pagination: TablePagination
    selectionEnabled?: boolean
    batchActions?: TableBatchAction<any>[]
    emptyText?: string
    operationLabel?: string
    operationWidth?: number | string
  }>(),
  {
    loading: false,
    rowKey: 'id',
    selectionEnabled: true,
    batchActions: () => [],
    emptyText: '暂无数据',
    operationLabel: '操作',
    operationWidth: 160,
  },
)

const emit = defineEmits<{
  selectionChange: [rows: TableRow[]]
  sortChange: [payload: { prop: string | null; order: 'ascending' | 'descending' | null }]
  pageChange: [page: number]
  sizeChange: [size: number]
  batchAction: [payload: { actionKey: string; rows: TableRow[] }]
  rowClick: [row: TableRow]
}>()

const selectedRows = ref<TableRow[]>([])

const hasSelection = computed(() => selectedRows.value.length > 0)
const hasOperationSlot = computed(() => Boolean(slots.operation))

// 同步表格勾选项并向外抛出事件。
function handleSelectionChange(rows: TableRow[]) {
  selectedRows.value = rows
  emit('selectionChange', rows)
}

// 规范化排序参数，方便页面层统一处理。
function handleSortChange(payload: {
  column: unknown
  prop: string | null
  order: 'ascending' | 'descending' | null
}) {
  emit('sortChange', {
    prop: payload.prop,
    order: payload.order,
  })
}

// 使用当前勾选结果触发批量操作。
function handleBatchAction(actionKey: string) {
  emit('batchAction', {
    actionKey,
    rows: selectedRows.value,
  })
}

// 在无选中项或业务声明禁用时禁用批量按钮。
function isBatchActionDisabled(action: TableBatchAction<any>) {
  if (!hasSelection.value) {
    return true
  }

  return action.disabled?.(selectedRows.value) ?? false
}

// 解析单元格展示值。
function formatCell(column: TableColumnSchema<any>, row: TableRow, index: number) {
  if (column.formatter) {
    return column.formatter(row, index)
  }

  if (!column.prop) {
    return ''
  }

  return row[column.prop as string] ?? '-'
}

// 避免向表格列传入空 prop。
function resolveColumnProp(prop: string | number | symbol | undefined): string | undefined {
  if (prop == null || prop === '') {
    return undefined
  }

  return String(prop)
}
</script>

<template>
  <section class="crud-table-shell">
    <div class="crud-table-toolbar">
      <div class="selection-summary">
        <span>已选择 {{ selectedRows.length }} 项</span>
      </div>

      <div class="batch-actions">
        <el-button
          v-for="action in batchActions"
          :key="action.key"
          :type="action.type ?? 'primary'"
          plain
          :disabled="isBatchActionDisabled(action)"
          @click="handleBatchAction(action.key)"
        >
          {{ action.label }}
        </el-button>
      </div>
    </div>

    <el-table
      :data="rows"
      :row-key="rowKey"
      border
      stripe
      :empty-text="emptyText"
      v-loading="loading"
      class="crud-table"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @row-click="emit('rowClick', $event)"
    >
      <el-table-column v-if="selectionEnabled" type="selection" width="52" />

      <el-table-column
        v-for="column in columns"
        :key="column.key"
        :prop="resolveColumnProp(column.prop)"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :align="column.align ?? 'left'"
        :sortable="column.sortable ?? false"
        :fixed="column.fixed"
      >
        <template #default="{ row, $index }">
          {{ formatCell(column, row, $index) }}
        </template>
      </el-table-column>

      <el-table-column
        v-if="hasOperationSlot"
        :label="props.operationLabel"
        :width="props.operationWidth"
        fixed="right"
        align="center"
      >
        <template #default="{ row, $index }">
          <slot name="operation" :row="row" :index="$index" />
        </template>
      </el-table-column>
    </el-table>

    <div class="crud-pagination">
      <el-pagination
        :current-page="pagination.currentPage"
        :page-size="pagination.pageSize"
        :page-sizes="pagination.pageSizes ?? [10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        :total="pagination.total"
        @current-change="emit('pageChange', $event)"
        @size-change="emit('sizeChange', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.crud-table-shell {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 24px;
  border: 1px solid rgba(29, 59, 54, 0.08);
  background: rgba(255, 255, 255, 0.78);
}

.crud-table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.selection-summary {
  color: #66706d;
  font-size: 0.92rem;
}

.batch-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.crud-pagination {
  display: flex;
  justify-content: flex-end;
}

:deep(.crud-table .el-table__row) {
  cursor: pointer;
}

@media (max-width: 768px) {
  .crud-pagination {
    justify-content: stretch;
  }
}
</style>
