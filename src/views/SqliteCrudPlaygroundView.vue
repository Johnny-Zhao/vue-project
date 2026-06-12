<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createTutorialTaskApi,
  deleteTutorialTaskApi,
  fetchTutorialGuideApi,
  fetchTutorialTaskDetailApi,
  fetchTutorialTasksApi,
  updateTutorialTaskApi,
} from '@/api/tutorialTasks'
import { useDialog } from '@/composables/useDialog'
import type {
  TutorialGuide,
  TutorialTask,
  TutorialTaskPageResult,
  TutorialTaskPayload,
  TutorialTaskQuery,
} from '@/types/tutorialTask'

const requestError = ref('')
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)

const guide = ref<TutorialGuide | null>(null)
const tasks = ref<TutorialTask[]>([])
const totalTasks = ref(0)
const selectedTaskId = ref<number | null>(null)

const keyword = ref('')
const statusFilter = ref<'all' | 'todo' | 'doing' | 'done'>('all')
const currentPage = ref(1)
const pageSize = ref(5)

const taskDialog = useDialog<TutorialTask>({
  createTitle: '新建任务',
  editTitle: '编辑任务',
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

    const result = await fetchTutorialTasksApi(query)

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
    const task = await fetchTutorialTaskDetailApi(taskId)
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
      await updateTutorialTaskApi(selectedTaskId.value as number, payload)
    } else {
      await createTutorialTaskApi(payload)
    }

    ElMessage.success(isEditing.value ? '任务已更新' : '任务已创建')
    closeTaskDialog()
    await loadTasks()
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    saving.value = false
  }
}

function tableRowClassName({ row }: { row: TutorialTask }) {
  return row.id === selectedTaskId.value ? 'task-row-active' : ''
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
  await ElMessageBox.confirm(`确认删除“${task.title}”吗？`, '删除任务', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  })

  deletingId.value = task.id
  requestError.value = ''

  try {
    await deleteTutorialTaskApi(task.id)

    if (selectedTaskId.value === task.id) {
      closeTaskDialog()
    }

    ElMessage.success('任务已删除')
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

async function initializePage() {
  loading.value = true
  requestError.value = ''

  try {
    const [guideResult, taskResult] = await Promise.all([
      fetchTutorialGuideApi(),
      fetchTutorialTasksApi({
        page: currentPage.value,
        pageSize: pageSize.value,
      }),
    ])

    guide.value = guideResult
    await applyPageResult(taskResult)
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void initializePage()
})
</script>

<template>
  <section class="crud-page">
    <header class="page-card intro-card">
      <div>
        <p class="section-label">Node + SQLite</p>
        <h2>用真实数据库走通一套增删改查</h2>
        <p class="intro-copy">
          这个页面一边请求 SQLite 接口，一边帮助你对照后端分层和查询、排序、分页这些常见逻辑。
        </p>
      </div>

      <div class="intro-actions">
        <el-button :loading="loading" @click="loadTasks({ resetPage: true })">刷新列表</el-button>
        <el-button type="primary" @click="openCreateDialog">新建任务</el-button>
      </div>
    </header>

    <div v-if="requestError" class="error-banner">{{ requestError }}</div>

    <section v-if="guide" class="guide-grid">
      <article class="page-card guide-card">
        <p class="section-label">请求流程</p>
        <h3>{{ guide.title }}</h3>
        <p class="guide-copy">{{ guide.summary }}</p>
        <ol class="ordered-list">
          <li v-for="step in guide.flowSteps" :key="step">{{ step }}</li>
        </ol>
      </article>

      <article class="page-card guide-card">
        <p class="section-label">中间件</p>
        <h3>先执行这些校验和上下文处理</h3>
        <ul class="info-list">
          <li v-for="item in guide.middlewares" :key="item.name">
            <strong>{{ item.name }}</strong>
            <span>{{ item.role }}</span>
          </li>
        </ul>
      </article>

      <article class="page-card guide-card">
        <p class="section-label">接口清单</p>
        <h3>前端当前会用到的接口</h3>
        <ul class="info-list endpoint-list">
          <li v-for="item in guide.endpoints" :key="`${item.method}-${item.path}`">
            <code>{{ item.method }} {{ item.path }}</code>
            <span>{{ item.description }}</span>
          </li>
        </ul>
      </article>

      <article class="page-card guide-card">
        <p class="section-label">数据库</p>
        <h3>SQLite 文件和表结构</h3>
        <div class="meta-list">
          <span><strong>引擎：</strong>{{ guide.database.engine }}</span>
          <span v-if="guide.database.command"
            ><strong>驱动：</strong>{{ guide.database.command }}</span
          >
          <span><strong>数据表：</strong>{{ guide.database.table }}</span>
          <span class="db-path"><strong>文件：</strong>{{ guide.database.file }}</span>
        </div>
      </article>
    </section>

    <article class="page-card workspace-card">
      <div class="workspace-head">
        <div>
          <p class="section-label">任务列表</p>
          <h3>直接请求 `/api/tutorial/tasks`</h3>
        </div>
        <span class="table-meta">共 {{ totalTasks }} 条</span>
      </div>

      <div class="filter-bar">
        <el-input v-model="keyword" clearable placeholder="按标题、负责人或描述搜索" />
        <el-select v-model="statusFilter" placeholder="状态">
          <el-option label="全部状态" value="all" />
          <el-option label="todo" value="todo" />
          <el-option label="doing" value="doing" />
          <el-option label="done" value="done" />
        </el-select>
        <el-button :loading="loading" type="primary" @click="loadTasks({ resetPage: true })">
          查询
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        class="task-table"
        :data="tasks"
        row-key="id"
        stripe
        border
        empty-text="暂无任务"
        :row-class-name="tableRowClassName"
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
        <el-table-column label="描述" min-width="220" show-overflow-tooltip sortable="custom">
          <template #default="{ row }">
            {{ row.description || '暂无描述' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="88" sortable="custom" />
        <el-table-column prop="priority" label="优先级" width="96" sortable="custom" />
        <el-table-column label="负责人" width="120" show-overflow-tooltip sortable="custom">
          <template #default="{ row }">
            {{ row.assignee || '未分配' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
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
      width="560px"
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
            placeholder="例如：补齐 SQLite CRUD 接口"
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
            placeholder="写一点任务背景，方便观察数据库字段如何被修改"
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

.page-card {
  padding: 1.1rem;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
}

.section-label {
  color: #2563eb;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.68rem;
  font-weight: 700;
}

.intro-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.intro-card h2,
.guide-card h3,
.workspace-card h3 {
  margin-top: 0.28rem;
  color: #0f172a;
  font-size: 1.12rem;
  font-weight: 700;
}

.intro-copy,
.guide-copy {
  margin-top: 0.5rem;
  color: #64748b;
  font-size: 0.9rem;
}

.intro-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.error-banner {
  padding: 0.88rem 1rem;
  border-radius: 14px;
  background: rgba(248, 113, 113, 0.08);
  color: #dc2626;
  border: 1px solid rgba(248, 113, 113, 0.16);
  font-size: 0.88rem;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.ordered-list,
.info-list {
  margin-top: 0.9rem;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.6rem;
  color: #64748b;
  font-size: 0.88rem;
}

.info-list li {
  display: grid;
  gap: 0.18rem;
}

.info-list strong,
.endpoint-list code {
  color: #0f172a;
}

.meta-list {
  margin-top: 0.9rem;
  display: grid;
  gap: 0.6rem;
  color: #64748b;
  font-size: 0.88rem;
}

.db-path {
  word-break: break-all;
}

.workspace-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.table-meta {
  color: #64748b;
  font-size: 0.84rem;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 180px auto;
  gap: 0.7rem;
  margin-top: 0.9rem;
}

.task-table {
  margin-top: 0.9rem;
  width: 100%;
}

:deep(.task-table .el-table__row) {
  cursor: pointer;
}

:deep(.task-table .task-row-active > td.el-table__cell) {
  background-color: rgba(37, 99, 235, 0.08) !important;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.9rem;
}

.form-grid {
  display: grid;
  gap: 0.85rem;
}

.dialog-form {
  margin-top: 0;
}

.form-grid label {
  display: grid;
  gap: 0.42rem;
  color: #64748b;
  font-size: 0.88rem;
}

.form-grid input,
.form-grid select,
.form-grid textarea {
  width: 100%;
  padding: 0.68rem 0.8rem;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #ffffff;
  color: #0f172a;
}

.textarea-field {
  grid-column: 1 / -1;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
}

@media (max-width: 1080px) {
  .intro-card,
  .guide-grid {
    grid-template-columns: 1fr;
  }

  .intro-card {
    flex-direction: column;
  }

  .filter-bar {
    grid-template-columns: 1fr;
  }

  .workspace-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-wrap {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
