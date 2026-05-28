<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'
import type { StudyStatus } from '@/types/study'

const careerPlanStore = useCounterStore()

// storeToRefs 可以在解构时保留响应式能力，这是 Pinia 里很常见的写法。
const {
  activeFilter,
  completedCount,
  doingCount,
  filteredTasks,
  pendingCount,
  summaryCards,
  weeklyFocusHours,
} = storeToRefs(careerPlanStore)

const { addWeeklyFocusHours, setActiveFilter, updateTaskStatus } = careerPlanStore

const filterOptions: Array<{ label: string; value: StudyStatus | 'all' }> = [
  { label: '全部', value: 'all' },
  { label: '待开始', value: 'todo' },
  { label: '进行中', value: 'doing' },
  { label: '已完成', value: 'done' },
]

const statusTextMap: Record<StudyStatus, string> = {
  todo: '待开始',
  doing: '进行中',
  done: '已完成',
}

function markTask(taskId: number, status: StudyStatus) {
  updateTaskStatus(taskId, status)
}
</script>

<template>
  <main class="dashboard">
    <section class="hero-card">
      <div>
        <p class="section-label">本周目标</p>
        <h2>先把 TypeScript 学成一门“能落到项目里”的语言</h2>
        <p class="hero-copy">
          这个页面模拟了一个真实一点的学习看板：左边是任务和筛选，右边是统计和解释。数据放在
          Pinia 里，所以切换路由后状态不会丢。
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

        <ul class="task-list">
          <li v-for="task in filteredTasks" :key="task.id" class="task-card">
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
                <button type="button" @click="markTask(task.id, 'todo')">待开始</button>
                <button type="button" @click="markTask(task.id, 'doing')">进行中</button>
                <button type="button" @click="markTask(task.id, 'done')">完成</button>
              </div>
            </div>
          </li>
        </ul>
      </article>

      <aside class="panel side-panel">
        <div>
          <p class="section-label">学习观察</p>
          <h3>这页里能看到的 TS / Pinia 点</h3>
        </div>

        <ul class="insight-list">
          <li>
            `StudyStatus` 是一个联合类型，它限制状态只能是 `todo`、`doing`、`done`。
          </li>
          <li>
            `storeToRefs()` 让我们从 Pinia store 解构状态时，依然保留响应式。
          </li>
          <li>
            `summaryCards` 是 computed 派生数据，原始状态一变，统计卡片会自动更新。
          </li>
          <li>
            `About` 页会读取同一份 store，这就是全局状态管理最直观的价值。
          </li>
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

.status-actions button:hover,
.focus-actions button:hover,
.filter-group button:hover {
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

  .panel-header {
    flex-direction: column;
  }
}
</style>
