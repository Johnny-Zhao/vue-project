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
import type { TutorialGuide, TutorialTask, TutorialTaskPayload } from '@/types/tutorialTask'

const requestError = ref('')
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)

const guide = ref<TutorialGuide | null>(null)
const tasks = ref<TutorialTask[]>([])
const selectedTaskId = ref<number | null>(null)

const keyword = ref('')
const statusFilter = ref<'all' | 'todo' | 'doing' | 'done'>('all')

const defaultForm = (): TutorialTaskPayload => ({
  title: '',
  status: 'todo',
  priority: 'medium',
  assignee: '',
  description: '',
})

const form = reactive<TutorialTaskPayload>(defaultForm())

const isEditing = computed(() => selectedTaskId.value !== null)

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

async function loadTasks() {
  loading.value = true
  requestError.value = ''

  try {
    tasks.value = await fetchTutorialTasksApi({
      keyword: keyword.value.trim() || undefined,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
    })

    if (
      selectedTaskId.value != null &&
      !tasks.value.some((task) => task.id === selectedTaskId.value)
    ) {
      resetForm()
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
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  requestError.value = ''

  try {
    const payload: TutorialTaskPayload = {
      title: form.title,
      status: form.status,
      priority: form.priority,
      assignee: form.assignee,
      description: form.description,
    }

    const task = isEditing.value
      ? await updateTutorialTaskApi(selectedTaskId.value as number, payload)
      : await createTutorialTaskApi(payload)

    ElMessage.success(isEditing.value ? '任务已更新' : '任务已创建')
    selectedTaskId.value = task.id
    fillForm(task)
    await loadTasks()
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    saving.value = false
  }
}

async function handleDelete(task: TutorialTask) {
  await ElMessageBox.confirm(`确认删除「${task.title}」吗？`, '删除任务', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  })

  deletingId.value = task.id
  requestError.value = ''

  try {
    await deleteTutorialTaskApi(task.id)

    if (selectedTaskId.value === task.id) {
      resetForm()
    }

    ElMessage.success('任务已删除')
    await loadTasks()
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    deletingId.value = null
  }
}

async function initializePage() {
  loading.value = true
  requestError.value = ''

  try {
    const [guideResult, taskResult] = await Promise.all([
      fetchTutorialGuideApi(),
      fetchTutorialTasksApi(),
    ])
    guide.value = guideResult
    tasks.value = taskResult
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
    <header class="page-card hero-card">
      <div>
        <p class="section-label">Node + SQLite</p>
        <h2>用真实数据库练一遍 Express 增删改查</h2>
        <p class="hero-copy">
          这个页面对应一套真实的 SQLite CRUD 接口。你可以一边操作任务，一边对照后端的 `middleware /
          controller / service / repository / database` 分层。
        </p>
      </div>

      <div class="hero-actions">
        <el-button :loading="loading" type="primary" @click="loadTasks">刷新任务列表</el-button>
        <el-button @click="resetForm">切回新增模式</el-button>
      </div>
    </header>

    <div v-if="requestError" class="error-banner">{{ requestError }}</div>

    <div v-if="guide" class="guide-grid">
      <article class="page-card panel">
        <p class="section-label">请求流程</p>
        <h3>{{ guide.title }}</h3>
        <p class="panel-copy">{{ guide.summary }}</p>

        <ol class="ordered-list">
          <li v-for="step in guide.flowSteps" :key="step">{{ step }}</li>
        </ol>
      </article>

      <article class="page-card panel">
        <p class="section-label">中间件</p>
        <h3>为什么这几个 middleware 要先走</h3>

        <ul class="middle-list">
          <li v-for="item in guide.middlewares" :key="item.name">
            <strong>{{ item.name }}</strong>
            <span>{{ item.role }}</span>
          </li>
        </ul>
      </article>

      <article class="page-card panel">
        <p class="section-label">接口清单</p>
        <h3>前端当前会用到这些接口</h3>

        <ul class="endpoint-list">
          <li v-for="item in guide.endpoints" :key="`${item.method}-${item.path}`">
            <code>{{ item.method }} {{ item.path }}</code>
            <span>{{ item.description }}</span>
          </li>
        </ul>
      </article>

      <article class="page-card panel">
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
    </div>

    <div class="workspace-grid">
      <article class="page-card panel">
        <div class="panel-head">
          <div>
            <p class="section-label">任务表单</p>
            <h3>{{ isEditing ? `编辑任务 #${selectedTaskId}` : '新建任务' }}</h3>
          </div>
        </div>

        <div class="form-grid">
          <label>
            <span>标题</span>
            <input
              v-model="form.title"
              type="text"
              maxlength="60"
              placeholder="例如：补充 SQLite CRUD 接口"
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
              placeholder="写一点任务背景，方便你观察数据库字段是怎么被更新的"
            />
          </label>
        </div>

        <div class="form-actions">
          <el-button type="primary" :loading="saving" @click="handleSubmit">
            {{ isEditing ? '保存修改' : '创建任务' }}
          </el-button>
          <el-button @click="resetForm">重置表单</el-button>
        </div>
      </article>

      <article class="page-card panel">
        <div class="panel-head">
          <div>
            <p class="section-label">SQLite 任务列表</p>
            <h3>直接请求 `/api/tutorial/tasks`</h3>
          </div>
        </div>

        <div class="filter-bar">
          <input v-model="keyword" type="text" placeholder="按标题 / 负责人 / 描述搜索" />
          <select v-model="statusFilter">
            <option value="all">全部状态</option>
            <option value="todo">todo</option>
            <option value="doing">doing</option>
            <option value="done">done</option>
          </select>
          <el-button :loading="loading" @click="loadTasks">筛选</el-button>
        </div>

        <div class="task-list">
          <button
            v-for="task in tasks"
            :key="task.id"
            type="button"
            class="task-card"
            :class="{ active: selectedTaskId === task.id }"
            @click="handleSelectTask(task.id)"
          >
            <div class="task-main">
              <strong>{{ task.title }}</strong>
              <span>{{ task.description || '暂无描述' }}</span>
            </div>

            <div class="task-side">
              <small>{{ task.status }} / {{ task.priority }}</small>
              <small>{{ task.assignee || '未分配' }}</small>
              <div class="task-actions">
                <el-button link type="primary" @click.stop="handleSelectTask(task.id)"
                  >编辑</el-button
                >
                <el-button
                  link
                  type="danger"
                  :loading="deletingId === task.id"
                  @click.stop="handleDelete(task)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.crud-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-card {
  padding: 1.5rem;
  border-radius: 28px;
  border: 1px solid rgba(29, 59, 54, 0.1);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 18px 40px rgba(19, 35, 33, 0.08);
}

.hero-card,
.guide-grid,
.workspace-grid {
  display: grid;
  gap: 1rem;
}

.hero-card {
  grid-template-columns: minmax(0, 1.7fr) minmax(240px, 1fr);
}

.guide-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.workspace-grid {
  grid-template-columns: minmax(320px, 0.95fr) minmax(0, 1.25fr);
}

.section-label {
  color: #7a5d2d;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.76rem;
  font-weight: 700;
}

.hero-card h2,
.panel h3 {
  margin-top: 0.35rem;
  color: #173937;
  font-size: 1.55rem;
  font-weight: 700;
}

.hero-copy,
.panel-copy {
  margin-top: 0.75rem;
  color: #566260;
  line-height: 1.6;
}

.hero-actions,
.form-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  justify-content: center;
}

.error-banner {
  padding: 1rem 1.25rem;
  border-radius: 18px;
  background: rgba(245, 108, 108, 0.12);
  color: #c45656;
  border: 1px solid rgba(245, 108, 108, 0.18);
}

.ordered-list,
.middle-list,
.endpoint-list {
  margin-top: 1rem;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.75rem;
  color: #4e5958;
}

.middle-list li,
.endpoint-list li {
  display: grid;
  gap: 0.2rem;
}

.middle-list strong,
.endpoint-list code {
  color: #173937;
}

.meta-list {
  margin-top: 1rem;
  display: grid;
  gap: 0.75rem;
  color: #566260;
}

.db-path {
  word-break: break-all;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.form-grid {
  display: grid;
  gap: 0.9rem;
  margin-top: 1rem;
}

.form-grid label {
  display: grid;
  gap: 0.45rem;
  color: #566260;
}

.form-grid input,
.form-grid select,
.form-grid textarea,
.filter-bar input,
.filter-bar select {
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: 14px;
  border: 1px solid rgba(29, 59, 54, 0.12);
  background: white;
  color: #173937;
}

.textarea-field {
  grid-column: 1 / -1;
}

.form-actions {
  margin-top: 1rem;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 180px auto;
  gap: 0.75rem;
  margin-top: 1rem;
}

.task-list {
  display: grid;
  gap: 0.85rem;
  margin-top: 1rem;
}

.task-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  padding: 1rem;
  border-radius: 20px;
  border: 1px solid rgba(29, 59, 54, 0.1);
  background: #f6f8f7;
  text-align: left;
  cursor: pointer;
}

.task-card.active {
  border-color: rgba(27, 93, 83, 0.45);
  box-shadow: inset 0 0 0 1px rgba(27, 93, 83, 0.12);
}

.task-main,
.task-side {
  display: grid;
  gap: 0.35rem;
}

.task-main strong {
  color: #173937;
}

.task-main span,
.task-side small {
  color: #5e6967;
}

.task-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 1080px) {
  .hero-card,
  .guide-grid,
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    grid-template-columns: 1fr;
  }
}
</style>
