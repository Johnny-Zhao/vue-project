<script setup lang="ts">
import { computed } from 'vue'
import { usePermission } from '@/features/auth/usePermission'
import TaskDialog from '@/features/task/components/TaskDialog.vue'
import { useTaskBoard } from '@/features/task/composables/useTaskBoard'

const { role, hasPermission } = usePermission()

const {
  activeFilter,
  completedCount,
  doingCount,
  pendingCount,
  summaryCards,
  weeklyFocusHours,
  loading,
  filterOptions,
  statusTextMap,
  keyword,
  normalizedKeyword,
  searchedTasks,
  currentPage,
  pageSize,
  total,
  pagedItems,
  handleCurrentChange,
  handleSizeChange,
  dialogVisible,
  dialogMode,
  dialogTaskId,
  addWeeklyFocusHours,
  setActiveFilter,
  markTask,
  handleDialogOpen,
  handleDialogEdit,
  handleTaskDelete,
} = useTaskBoard()

const canCreateTask = computed(() => hasPermission('task:create'))
const canEditTask = computed(() => hasPermission('task:edit'))
const isViewerMode = computed(() => role.value === 'viewer')
</script>

<template>
  <main class="dashboard">
    <section class="hero-card">
      <div class="hero-copy-block">
        <p class="section-label">任务总览</p>
        <h2>把练习项目整理成一个更像样的后台工作台</h2>
        <p class="hero-copy">
          这里集中演示任务状态、权限差异、查询筛选和分页交互，适合一边看前端，一边对照后端链路。
        </p>
      </div>

      <div class="focus-box">
        <span>本周专注时长</span>
        <strong>{{ weeklyFocusHours }}h</strong>
        <div class="focus-actions">
          <button type="button" @click="addWeeklyFocusHours(-1)">-1h</button>
          <button type="button" @click="addWeeklyFocusHours(1)">+1h</button>
        </div>
      </div>
    </section>

    <div class="toolbar">
      <el-button v-permission="'task:create'" type="primary" @click="handleDialogOpen">
        新建任务
      </el-button>
      <div v-if="!canCreateTask" class="permission-note">
        当前角色可浏览数据，但不能新增或编辑任务。
      </div>
    </div>

    <section class="summary-grid">
      <article v-for="card in summaryCards" :key="card.label" class="summary-card">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
        <p>{{ card.hint }}</p>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-header">
          <div>
            <p class="section-label">任务列表</p>
            <h3>统一状态管理下的任务面板</h3>
          </div>

          <div class="filter-group">
            <button
              v-for="option in filterOptions"
              :key="option.value"
              type="button"
              :class="{ active: activeFilter === option.value }"
              @click="setActiveFilter(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="control-bar">
          <div class="search-box">
            <span>关键词</span>
            <el-input v-model="keyword" clearable placeholder="按标题、摘要或分类搜索" />
          </div>
        </div>

        <div class="meta-line">
          <span>当前关键词：{{ normalizedKeyword || '无' }}</span>
          <span>可见任务：{{ searchedTasks.length }}</span>
        </div>

        <div v-if="loading" class="loading-text">任务加载中...</div>

        <ul class="task-list">
          <li
            v-for="task in pagedItems"
            :key="task.id"
            class="task-card"
            :class="{ readonly: !canEditTask }"
            @click="canEditTask && handleDialogEdit(task.id)"
          >
            <div class="task-main">
              <div class="task-meta">
                <span class="category">{{ task.category }}</span>
                <span class="priority" :data-priority="task.priority">{{ task.priority }}</span>
              </div>
              <h4>{{ task.title }}</h4>
              <p>{{ task.summary }}</p>
            </div>

            <div class="task-side">
              <span class="status-badge" :data-status="task.status">
                {{ statusTextMap[task.status] }}
              </span>
              <span class="hours">{{ task.estimateHours }}h</span>

              <div class="status-actions">
                <button
                  v-permission="'task:status:update'"
                  type="button"
                  @click.stop="markTask(task.id, 'todo')"
                >
                  设为待办
                </button>
                <button
                  v-permission="'task:status:update'"
                  type="button"
                  @click.stop="markTask(task.id, 'doing')"
                >
                  设为进行中
                </button>
                <button
                  v-permission="'task:status:update'"
                  type="button"
                  @click.stop="markTask(task.id, 'done')"
                >
                  设为完成
                </button>
                <button
                  v-permission="'task:delete'"
                  class="danger-button"
                  type="button"
                  @click.stop="handleTaskDelete(task.id)"
                >
                  删除
                </button>
                <span v-if="isViewerMode" class="readonly-tip">只读角色</span>
              </div>
            </div>
          </li>
        </ul>

        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[3, 5, 10]"
            layout="total, sizes, prev, pager, next"
            :total="total"
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange"
          />
        </div>
      </article>

      <aside class="panel side-panel">
        <div>
          <p class="section-label">权限说明</p>
          <h3>这个页面在验证什么</h3>
        </div>

        <ul class="insight-list">
          <li>`admin` 可以新增、编辑、改状态，也可以删除任务。</li>
          <li>`viewer` 仍能看到共享数据，但页面保持只读。</li>
          <li>路由权限控制入口，按钮权限控制更细粒度的操作。</li>
          <li>这也是后台系统里很常见的菜单权限和操作权限拆分方式。</li>
        </ul>

        <div class="mini-stats">
          <div>
            <span>进行中</span>
            <strong>{{ doingCount }}</strong>
          </div>
          <div>
            <span>待办</span>
            <strong>{{ pendingCount }}</strong>
          </div>
          <div>
            <span>完成</span>
            <strong>{{ completedCount }}</strong>
          </div>
        </div>
      </aside>
    </section>
  </main>

  <TaskDialog
    v-if="canCreateTask || canEditTask"
    v-model:show="dialogVisible"
    :mode="dialogMode"
    :task-id="dialogTaskId"
  />
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hero-card,
.panel,
.summary-card {
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.9fr) 220px;
  gap: 0.9rem;
  padding: 1.2rem;
}

.section-label {
  color: #2563eb;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.68rem;
  font-weight: 700;
}

.hero-card h2,
.panel h3 {
  margin-top: 0.28rem;
  color: #0f172a;
  font-size: 1.18rem;
  font-weight: 700;
}

.hero-copy {
  max-width: 42rem;
  margin-top: 0.55rem;
  color: #64748b;
  font-size: 0.92rem;
}

.focus-box {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 14px;
  background: linear-gradient(180deg, #eff6ff, #dbeafe);
}

.focus-box span {
  color: #2563eb;
  font-size: 0.82rem;
}

.focus-box strong {
  font-size: 1.7rem;
  font-weight: 700;
  color: #0f172a;
}

.focus-actions {
  display: flex;
  gap: 0.55rem;
}

.focus-actions button,
.filter-group button,
.status-actions button {
  border: 0;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.focus-actions button {
  flex: 1;
  padding: 0.62rem 0;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.84rem;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
}

.permission-note {
  padding: 0.56rem 0.88rem;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #64748b;
  font-size: 0.84rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
}

.summary-card {
  padding: 1rem;
}

.summary-card span,
.summary-card p {
  color: #64748b;
  font-size: 0.84rem;
}

.summary-card strong {
  display: block;
  margin: 0.28rem 0 0.4rem;
  font-size: 1.55rem;
  color: #0f172a;
  font-weight: 700;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) 280px;
  gap: 0.9rem;
}

.panel {
  padding: 1.15rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 0.9rem;
  align-items: flex-start;
}

.filter-group {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.filter-group button {
  padding: 0.48rem 0.78rem;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.16);
  color: #475569;
  font-size: 0.84rem;
}

.filter-group button.active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.control-bar {
  display: flex;
  justify-content: space-between;
  gap: 0.9rem;
  margin-top: 0.9rem;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 260px;
  flex: 1;
}

.search-box span,
.meta-line {
  color: #64748b;
  font-size: 0.84rem;
}

.meta-line {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.85rem;
  flex-wrap: wrap;
}

.loading-text {
  margin-top: 0.9rem;
  color: #2563eb;
  font-size: 0.84rem;
}

.task-list,
.insight-list {
  list-style: none;
}

.task-list {
  display: grid;
  gap: 0.8rem;
  margin-top: 1rem;
}

.task-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px;
  gap: 0.9rem;
  padding: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  background: #f8fafc;
  cursor: pointer;
}

.task-card.readonly {
  cursor: default;
}

.task-main h4 {
  margin-top: 0.45rem;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 700;
}

.task-main p {
  margin-top: 0.38rem;
  color: #64748b;
  font-size: 0.88rem;
}

.task-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category,
.priority,
.status-badge,
.hours {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.24rem 0.62rem;
  font-size: 0.74rem;
}

.category {
  background: #dbeafe;
  color: #1d4ed8;
}

.priority {
  text-transform: uppercase;
}

.priority[data-priority='high'] {
  background: #fee2e2;
  color: #b91c1c;
}

.priority[data-priority='medium'] {
  background: #ede9fe;
  color: #6d28d9;
}

.priority[data-priority='low'] {
  background: #dcfce7;
  color: #15803d;
}

.task-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.6rem;
}

.status-badge[data-status='todo'] {
  background: #fef3c7;
  color: #b45309;
}

.status-badge[data-status='doing'] {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge[data-status='done'] {
  background: #dcfce7;
  color: #15803d;
}

.hours {
  background: #e2e8f0;
  color: #475569;
}

.status-actions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
}

.status-actions button {
  width: 100%;
  padding: 0.54rem 0.72rem;
  border-radius: 12px;
  background: #ffffff;
  color: #334155;
  border: 1px solid rgba(148, 163, 184, 0.18);
  font-size: 0.82rem;
}

.danger-button {
  background: #fff1f2;
  color: #be123c;
}

.readonly-tip {
  display: inline-flex;
  justify-content: center;
  width: 100%;
  padding: 0.54rem 0.72rem;
  border-radius: 12px;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.8rem;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.status-actions button:hover,
.focus-actions button:hover,
.filter-group button:hover,
.task-card:hover {
  transform: translateY(-1px);
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.insight-list {
  display: grid;
  gap: 0.7rem;
  color: #64748b;
  font-size: 0.88rem;
}

.mini-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.mini-stats div {
  padding: 0.82rem;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.mini-stats span {
  color: #64748b;
  font-size: 0.76rem;
}

.mini-stats strong {
  display: block;
  margin-top: 0.15rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

@media (max-width: 960px) {
  .hero-card,
  .content-grid,
  .task-card,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .task-side {
    align-items: stretch;
  }

  .panel-header,
  .control-bar,
  .meta-line {
    flex-direction: column;
  }

  .toolbar,
  .pagination-wrap {
    justify-content: stretch;
  }
}
</style>
