<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createPostgresTutorialTaskApi,
  deletePostgresTutorialTaskApi,
  fetchPostgresTutorialTaskDetailApi,
  fetchPostgresTutorialTasksApi,
  updatePostgresTutorialTaskApi,
} from '@/api/postgresTutorialTasks'
import { useDialog } from '@/composables/useDialog'
import type {
  TutorialTask,
  TutorialTaskPageResult,
  TutorialTaskPayload,
  TutorialTaskQuery,
} from '@/types/tutorialTask'

const requestError = ref('')
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)

const tasks = ref<TutorialTask[]>([])
const totalTasks = ref(0)
const selectedTaskId = ref<number | null>(null)

const keyword = ref('')
const statusFilter = ref<'all' | 'todo' | 'doing' | 'done'>('all')
const currentPage = ref(1)
const pageSize = ref(5)

const taskDialog = useDialog<TutorialTask>({
  createTitle: '新建 PostgreSQL 任务',
  editTitle: '编辑 PostgreSQL 任务',
})

const defaultForm = (): TutorialTaskPayload => ({
  title: '',
  status: 'todo',
  priority: 'medium',
  assignee: '',
  description: '',
})

const form = reactive<TutorialTaskPayload>(defaultForm())

const isEditing = computed(() => taskDialog.mode.value === 'edit' && selectedTaskId.value !== null)

type TableSortOrder = 'ascending' | 'descending' | null
type TableSortState = {
  prop: keyof TutorialTask | null
  order: TableSortOrder
}

const sortState = reactive<TableSortState>({
  prop: null,
  order: null,
})

function fillForm(task: TutorialTask) {
  form.title = task.title
  form.status = task.status
  form.priority = task.priority
  form.assignee = task.assignee
  form.description = task.description
}

function resetForm() {
  selectedTaskId.value = null
  Object.assign(form, defaultForm())
}

function resolveErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试。'
}

function openCreateDialog() {
  requestError.value = ''
  resetForm()
  taskDialog.openCreate()
}

function closeTaskDialog() {
  taskDialog.close()
  resetForm()
}

function validateForm() {
  if (!form.title.trim()) {
    ElMessage.warning('请先填写任务标题')
    return false
  }

  return true
}

async function applyPageResult(result: TutorialTaskPageResult) {
  tasks.value = result.list
  totalTasks.value = result.total
  currentPage.value = result.page
  pageSize.value = result.pageSize

  const maxPage = Math.max(1, Math.ceil(result.total / result.pageSize))
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage
    await loadTasks()
  }
}

async function loadTasks(options: { resetPage?: boolean } = {}) {
  loading.value = true
  requestError.value = ''

  try {
    if (options.resetPage) {
      currentPage.value = 1
    }

    const query: TutorialTaskQuery = {
      keyword: keyword.value.trim() || undefined,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
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

    const result = await fetchPostgresTutorialTasksApi(query)
    await applyPageResult(result)

    if (
      selectedTaskId.value != null &&
      !tasks.value.some((task) => task.id === selectedTaskId.value)
    ) {
      closeTaskDialog()
    }
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

async function handleSelectTask(taskId: number) {
  loading.value = true
  requestError.value = ''

  try {
    const task = await fetchPostgresTutorialTaskDetailApi(taskId)
    selectedTaskId.value = task.id
    fillForm(task)
    taskDialog.openEdit(task)
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  saving.value = true
  requestError.value = ''

  try {
    const payload: TutorialTaskPayload = {
      title: form.title.trim(),
      status: form.status,
      priority: form.priority,
      assignee: form.assignee.trim(),
      description: form.description.trim(),
    }

    if (isEditing.value) {
      await updatePostgresTutorialTaskApi(selectedTaskId.value as number, payload)
    } else {
      await createPostgresTutorialTaskApi(payload)
    }

    ElMessage.success(isEditing.value ? 'PostgreSQL 任务已更新' : 'PostgreSQL 任务已创建')
    closeTaskDialog()
    await loadTasks()
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    saving.value = false
  }
}

function handleTableRowClick(row: TutorialTask) {
  void handleSelectTask(row.id)
}

function handleSortChange(payload: {
  column: unknown
  prop: keyof TutorialTask | null
  order: TableSortOrder
}) {
  sortState.prop = payload.order ? payload.prop : null
  sortState.order = payload.order
  void loadTasks()
}

async function handleDelete(task: TutorialTask) {
  await ElMessageBox.confirm(`确认删除“${task.title}”吗？`, '删除 PostgreSQL 任务', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  })

  deletingId.value = task.id
  requestError.value = ''

  try {
    await deletePostgresTutorialTaskApi(task.id)

    if (selectedTaskId.value === task.id) {
      closeTaskDialog()
    }

    ElMessage.success('PostgreSQL 任务已删除')
    await loadTasks()
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    deletingId.value = null
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  void loadTasks()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  void loadTasks()
}

void loadTasks()
</script>

<template>
  <section class="crud-page">
    <article class="page-card panel">
      <div class="toolbar">
        <div class="filter-bar">
          <el-input v-model="keyword" clearable placeholder="按标题 / 负责人 / 描述搜索" />
          <el-select v-model="statusFilter" placeholder="请选择状态">
            <el-option label="全部状态" value="all" />
            <el-option label="todo" value="todo" />
            <el-option label="doing" value="doing" />
            <el-option label="done" value="done" />
          </el-select>
        </div>

        <div class="action-bar">
          <el-button :loading="loading" @click="loadTasks({ resetPage: true })">查询</el-button>
          <el-button :loading="loading" type="primary" @click="loadTasks({ resetPage: true })">
            刷新
          </el-button>
          <el-button type="success" @click="openCreateDialog">新建任务</el-button>
        </div>
      </div>

      <div v-if="requestError" class="error-banner">{{ requestError }}</div>

      <div class="panel-head">
        <span class="table-meta">共 {{ totalTasks }} 条</span>
      </div>

      <el-table
        v-loading="loading"
        class="task-table"
        :data="tasks"
        row-key="id"
        stripe
        border
        empty-text="暂无 PostgreSQL 任务"
        @row-click="handleTableRowClick"
        @sort-change="handleSortChange"
      >
        <el-table-column
          prop="title"
          label="标题"
          min-width="180"
          show-overflow-tooltip
          sortable="custom"
        />
        <el-table-column
          prop="description"
          label="描述"
          min-width="220"
          show-overflow-tooltip
          sortable="custom"
        />
        <el-table-column prop="status" label="状态" width="88" sortable="custom" />
        <el-table-column prop="priority" label="优先级" width="96" sortable="custom" />
        <el-table-column
          prop="assignee"
          label="负责人"
          width="120"
          show-overflow-tooltip
          sortable="custom"
        />
        <el-table-column prop="updatedAt" label="更新时间" min-width="180" sortable="custom" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="handleSelectTask(row.id)">编辑</el-button>
            <el-button
              link
              type="danger"
              :loading="deletingId === row.id"
              @click.stop="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[5, 10, 20]"
          :total="totalTasks"
          background
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </article>

    <el-dialog
      v-model="taskDialog.visible.value"
      :title="taskDialog.title.value"
      width="640px"
      destroy-on-close
      @closed="closeTaskDialog"
    >
      <div class="form-grid dialog-form">
        <label>
          <span>标题</span>
          <input
            v-model="form.title"
            type="text"
            maxlength="60"
            placeholder="例如：补充 PostgreSQL CRUD 接口"
          />
        </label>

        <label>
          <span>负责人</span>
          <input v-model="form.assignee" type="text" maxlength="30" placeholder="例如：Backend" />
        </label>

        <label>
          <span>状态</span>
          <select v-model="form.status">
            <option value="todo">todo</option>
            <option value="doing">doing</option>
            <option value="done">done</option>
          </select>
        </label>

        <label>
          <span>优先级</span>
          <select v-model="form.priority">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>

        <label class="textarea-field">
          <span>描述</span>
          <textarea
            v-model="form.description"
            rows="5"
            maxlength="300"
            placeholder="写一点任务背景，方便后续检索和排序"
          />
        </label>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <el-button @click="closeTaskDialog">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSubmit">
            {{ isEditing ? '保存修改' : '创建任务' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.crud-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 180px;
  gap: 0.75rem;
  flex: 1;
}

.action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.panel-head {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.task-table {
  margin-top: 1rem;
  width: 100%;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.form-grid {
  display: grid;
  gap: 0.9rem;
}

.dialog-form {
  margin-top: 0;
}

.form-grid label {
  display: grid;
  gap: 0.45rem;
}

.textarea-field {
  grid-column: 1 / -1;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 1080px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar {
    grid-template-columns: 1fr;
  }

  .action-bar {
    justify-content: flex-start;
  }

  .pagination-wrap {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
