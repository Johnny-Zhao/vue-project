<script setup lang="ts">
import AddEditDialog from '@/views/components/addEditDialog.vue'
import { useTaskBoard } from '@/composables/useTaskBoard'

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
  sortField,
  sortDirection,
  sortFieldOptions,
  sortDirectionOptions,
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
</script>

<template>
  <main class="dashboard">
    <section class="hero-card">
      <div>
        <p class="section-label">本周目标</p>
        <h2>先把 TypeScript 学成一门能落到项目里的语言</h2>
        <p class="hero-copy">
          这页现在把筛选、排序、查询、分页、弹框表单都拆成了组合式逻辑。你也可以把删除动作看成一个完整的小闭环：
          Pinia action、确认弹框、列表更新。
        </p>
      </div>

      <div class="focus-box">
        <span>本周专注时长</span>
        <strong>{{ weeklyFocusHours }} 小时</strong>
        <div class="focus-actions">
          <button type="button" @click="addWeeklyFocusHours(-1)">-1h</button>
          <button type="button" @click="addWeeklyFocusHours(1)">+1h</button>
        </div>
      </div>
    </section>

    <div class="toolbar">
      <el-button type="primary" @click="handleDialogOpen">新增任务</el-button>
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
            <h3>Pinia 状态驱动的学习任务</h3>
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
            <span>关键字查询</span>
            <el-input
              v-model="keyword"
              clearable
              placeholder="按任务名称、描述、分类查询"
            />
          </div>

          <div class="sort-bar">
            <div class="sort-item">
              <span>排序字段</span>
              <el-select v-model="sortField" class="sort-select">
                <el-option
                  v-for="item in sortFieldOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </div>

            <div class="sort-item">
              <span>排序方向</span>
              <el-select v-model="sortDirection" class="sort-select">
                <el-option
                  v-for="item in sortDirectionOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </div>
          </div>
        </div>

        <div class="meta-line">
          <span>当前查询：{{ normalizedKeyword || '无' }}</span>
          <span>筛选后总数：{{ searchedTasks.length }}</span>
        </div>

        <div v-if="loading" class="loading-text">正在加载任务列表...</div>

        <ul class="task-list">
          <li
            v-for="task in pagedItems"
            :key="task.id"
            class="task-card"
            @click="handleDialogEdit(task.id)"
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
                <button type="button" @click.stop="markTask(task.id, 'todo')">待开始</button>
                <button type="button" @click.stop="markTask(task.id, 'doing')">进行中</button>
                <button type="button" @click.stop="markTask(task.id, 'done')">已完成</button>
                <button class="danger-button" type="button" @click.stop="handleTaskDelete(task.id)">
                  删除
                </button>
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
          <p class="section-label">学习观察</p>
          <h3>这页里能看到的 TS / Vue3 点</h3>
        </div>

        <ul class="insight-list">
          <li>`deleteTask(taskId: number)` 是最基础但很真实的 Pinia action。</li>
          <li>`handleTaskDelete()` 把确认弹框和 store 删除动作连起来，这就是页面层逻辑。</li>
          <li>删除按钮用了 `@click.stop`，避免触发整卡的编辑逻辑。</li>
          <li>删除后分页会自动联动，因为页码逻辑已经被抽到 `usePagination()` 里了。</li>
        </ul>

        <div class="mini-stats">
          <div>
            <span>进行中</span>
            <strong>{{ doingCount }}</strong>
          </div>
          <div>
            <span>待开始</span>
            <strong>{{ pendingCount }}</strong>
          </div>
          <div>
            <span>已完成</span>
            <strong>{{ completedCount }}</strong>
          </div>
        </div>
      </aside>
    </section>
  </main>

  <AddEditDialog v-model:show="dialogVisible" :mode="dialogMode" :task-id="dialogTaskId" />
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero-card,
.panel,
.summary-card {
  border-radius: 28px;
  border: 1px solid rgba(29, 59, 54, 0.1);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 18px 40px rgba(19, 35, 33, 0.08);
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(260px, 1fr);
  gap: 1rem;
  padding: 1.75rem;
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
  margin-top: 0.4rem;
  color: #16302f;
  font-size: 1.6rem;
  font-weight: 700;
}

.hero-copy {
  max-width: 42rem;
  margin-top: 0.75rem;
  color: #4d5a58;
}

.focus-box {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
  border-radius: 24px;
  background: linear-gradient(180deg, #fcf2df, #f2dfbd);
}

.focus-box span {
  color: #7a5d2d;
}

.focus-box strong {
  font-size: 2rem;
  font-weight: 700;
  color: #173937;
}

.focus-actions {
  display: flex;
  gap: 0.75rem;
}

.focus-actions button,
.filter-group button,
.status-actions button {
  border: 0;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
}

.focus-actions button {
  flex: 1;
  padding: 0.8rem 0;
  border-radius: 999px;
  background: #173937;
  color: #fff8ef;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.summary-card {
  padding: 1.25rem;
}

.summary-card span,
.summary-card p {
  color: #56615f;
}

.summary-card strong {
  display: block;
  margin: 0.35rem 0 0.5rem;
  font-size: 2rem;
  color: #173937;
  font-weight: 700;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 1rem;
}

.panel {
  padding: 1.5rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.filter-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-group button {
  padding: 0.65rem 0.9rem;
  border-radius: 999px;
  background: #edf2ef;
  color: #36514d;
}

.filter-group button.active {
  background: #163f38;
  color: #fff8ef;
}

.control-bar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 280px;
  flex: 1;
}

.search-box span,
.sort-item span,
.meta-line {
  color: #56615f;
  font-size: 0.9rem;
}

.sort-bar {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.sort-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sort-select {
  width: 160px;
}

.meta-line {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.loading-text {
  margin-top: 1rem;
  color: #7a5d2d;
}

.task-list,
.insight-list {
  list-style: none;
}

.task-list {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.task-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 1rem;
  padding: 1.1rem;
  border-radius: 22px;
  background: #f6f8f7;
  cursor: pointer;
}

.task-main h4 {
  margin-top: 0.5rem;
  color: #193735;
  font-size: 1.1rem;
  font-weight: 700;
}

.task-main p {
  margin-top: 0.45rem;
  color: #5a6664;
}

.task-meta {
  display: flex;
  gap: 0.6rem;
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
  padding: 0.3rem 0.7rem;
  font-size: 0.8rem;
}

.category {
  background: #d8ede8;
  color: #1b5d53;
}

.priority {
  text-transform: uppercase;
}

.priority[data-priority='high'] {
  background: #fde1cf;
  color: #a4511b;
}

.priority[data-priority='medium'] {
  background: #efe7ff;
  color: #5d38a5;
}

.priority[data-priority='low'] {
  background: #dce9ff;
  color: #2753a6;
}

.task-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.status-badge[data-status='todo'] {
  background: #f8e7d8;
  color: #8e4b18;
}

.status-badge[data-status='doing'] {
  background: #dceaff;
  color: #2a5698;
}

.status-badge[data-status='done'] {
  background: #d8f1e1;
  color: #1a6c45;
}

.hours {
  background: #ebeef0;
  color: #4d5a58;
}

.status-actions {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  width: 100%;
}

.status-actions button {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border-radius: 14px;
  background: white;
  color: #244946;
  border: 1px solid rgba(29, 59, 54, 0.08);
}

.danger-button {
  background: #fde7e2;
  color: #b6422a;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.25rem;
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
  gap: 1.25rem;
}

.insight-list {
  display: grid;
  gap: 0.85rem;
  color: #4e5958;
}

.mini-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.mini-stats div {
  padding: 1rem;
  border-radius: 18px;
  background: #f3eee4;
}

.mini-stats span {
  color: #7a5d2d;
  font-size: 0.82rem;
}

.mini-stats strong {
  display: block;
  margin-top: 0.2rem;
  font-size: 1.6rem;
  font-weight: 700;
  color: #173937;
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
  .sort-bar,
  .sort-item,
  .meta-line {
    flex-direction: column;
  }

  .toolbar,
  .pagination-wrap {
    justify-content: stretch;
  }
}
</style>
