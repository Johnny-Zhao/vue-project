<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
  fetchDemoTaskDetailApi,
  fetchDemoTasksApi,
  fetchExpressOverviewApi,
  fetchExpressStructureApi,
  postEchoPayloadApi,
} from '@/api/serverDemo'
import type {
  DemoTaskItem,
  EchoPayloadResult,
  ExpressOverview,
  ExpressStructureItem,
} from '@/types/serverDemo'

const loadingKey = ref('')
const requestError = ref('')

const overview = ref<ExpressOverview | null>(null)
const structureItems = ref<ExpressStructureItem[]>([])
const demoTasks = ref<DemoTaskItem[]>([])
const selectedTask = ref<DemoTaskItem | null>(null)
const echoResult = ref<EchoPayloadResult | null>(null)

const echoForm = reactive({
  topic: 'Express 学习',
  scene: '前端调用后端接口',
  count: 3,
})

async function runRequest(key: string, request: () => Promise<void>) {
  loadingKey.value = key
  requestError.value = ''

  try {
    await request()
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : '请求失败，请稍后重试。'
  } finally {
    loadingKey.value = ''
  }
}

function handleLoadOverview() {
  return runRequest('overview', async () => {
    overview.value = await fetchExpressOverviewApi()
  })
}

function handleLoadStructure() {
  return runRequest('structure', async () => {
    structureItems.value = await fetchExpressStructureApi()
  })
}

function handleLoadTasks() {
  return runRequest('tasks', async () => {
    demoTasks.value = await fetchDemoTasksApi()
  })
}

function handleLoadTaskDetail(id: number) {
  return runRequest(`task-${id}`, async () => {
    selectedTask.value = await fetchDemoTaskDetailApi(id)
  })
}

function handleSendEcho() {
  return runRequest('echo', async () => {
    echoResult.value = await postEchoPayloadApi({ ...echoForm })
  })
}
</script>

<template>
  <section class="express-page">
    <header class="page-card hero-card">
      <div>
        <p class="section-label">Express Playground</p>
        <h2>边看目录结构，边请求后端接口</h2>
        <p class="hero-copy">
          这个页面专门用来学习 Express
          的标准分层：入口、路由、控制器、服务、假数据和中间件分别放在哪里，以及前端如何请求这些接口。
        </p>
      </div>

      <div class="hero-actions">
        <el-button type="primary" :loading="loadingKey === 'overview'" @click="handleLoadOverview">
          请求概览接口
        </el-button>
        <el-button :loading="loadingKey === 'structure'" @click="handleLoadStructure">
          请求目录结构接口
        </el-button>
        <el-button :loading="loadingKey === 'tasks'" @click="handleLoadTasks">
          请求任务列表示例
        </el-button>
      </div>
    </header>

    <div v-if="requestError" class="error-banner">{{ requestError }}</div>

    <div class="content-grid">
      <article class="page-card panel">
        <p class="section-label">服务概览</p>
        <h3>GET `/api/demo/overview`</h3>
        <p class="panel-copy">这个接口适合用来返回“后端项目说明、规范、用途”这类静态信息。</p>

        <template v-if="overview">
          <div class="meta-chip">{{ overview.project }}</div>
          <p class="overview-copy">{{ overview.description }}</p>

          <div class="stack-list">
            <span v-for="item in overview.stack" :key="item">{{ item }}</span>
          </div>

          <ul class="simple-list">
            <li v-for="item in overview.conventions" :key="item">{{ item }}</li>
          </ul>
        </template>
      </article>

      <article class="page-card panel">
        <p class="section-label">目录结构</p>
        <h3>GET `/api/demo/structure`</h3>
        <p class="panel-copy">
          这个接口把 Express 分层直接返回给前端，方便你一边学结构一边对照目录。
        </p>

        <ul class="structure-list">
          <li v-for="item in structureItems" :key="item.path">
            <strong>{{ item.path }}</strong>
            <span>{{ item.role }}</span>
          </li>
        </ul>
      </article>
    </div>

    <div class="content-grid bottom-grid">
      <article class="page-card panel">
        <p class="section-label">列表与详情</p>
        <h3>GET `/api/demo/tasks` / `/api/demo/tasks/:id`</h3>
        <p class="panel-copy">这组接口用来演示最常见的列表查询和详情查询，适合学习 REST 风格。</p>

        <div class="task-list">
          <button
            v-for="task in demoTasks"
            :key="task.id"
            type="button"
            class="task-card"
            @click="handleLoadTaskDetail(task.id)"
          >
            <span>{{ task.title }}</span>
            <small>{{ task.status }} / {{ task.priority }}</small>
          </button>
        </div>

        <div v-if="selectedTask" class="detail-box">
          <p>当前详情</p>
          <strong>{{ selectedTask.title }}</strong>
          <span>负责人：{{ selectedTask.owner }}</span>
          <span>状态：{{ selectedTask.status }}</span>
          <span>优先级：{{ selectedTask.priority }}</span>
        </div>
      </article>

      <article class="page-card panel">
        <p class="section-label">POST 示例</p>
        <h3>POST `/api/demo/echo`</h3>
        <p class="panel-copy">这个接口最适合学习“前端提交 JSON，请求体在后端如何读取和回显”。</p>

        <div class="form-grid">
          <label>
            <span>topic</span>
            <input v-model="echoForm.topic" type="text" />
          </label>
          <label>
            <span>scene</span>
            <input v-model="echoForm.scene" type="text" />
          </label>
          <label>
            <span>count</span>
            <input v-model.number="echoForm.count" type="number" min="1" />
          </label>
        </div>

        <el-button type="success" :loading="loadingKey === 'echo'" @click="handleSendEcho">
          提交 Echo 请求
        </el-button>

        <pre v-if="echoResult" class="json-box">{{ JSON.stringify(echoResult, null, 2) }}</pre>
      </article>
    </div>
  </section>
</template>

<style scoped>
.express-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-card {
  padding: 1.5rem;
  border-radius: 28px;
  border: 1px solid rgba(29, 59, 54, 0.1);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 40px rgba(19, 35, 33, 0.08);
}

.hero-card,
.content-grid {
  display: grid;
  gap: 1rem;
}

.hero-card {
  grid-template-columns: minmax(0, 1.8fr) minmax(260px, 1fr);
}

.content-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  font-size: 1.6rem;
  font-weight: 700;
}

.hero-copy,
.panel-copy,
.overview-copy {
  margin-top: 0.75rem;
  color: #566260;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
}

.error-banner {
  padding: 1rem 1.25rem;
  border-radius: 18px;
  background: rgba(245, 108, 108, 0.12);
  color: #c45656;
  border: 1px solid rgba(245, 108, 108, 0.18);
}

.meta-chip {
  display: inline-flex;
  margin-top: 1rem;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: #efe5d1;
  color: #7a5d2d;
}

.stack-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}

.stack-list span {
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: #dcebe7;
  color: #1b5d53;
}

.simple-list,
.structure-list {
  margin-top: 1rem;
  padding-left: 1.2rem;
  color: #4e5958;
  display: grid;
  gap: 0.75rem;
}

.structure-list li {
  display: grid;
  gap: 0.25rem;
}

.structure-list strong {
  color: #173937;
}

.task-list {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.task-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(29, 59, 54, 0.1);
  border-radius: 18px;
  background: #f6f8f7;
  color: #173937;
  cursor: pointer;
}

.task-card small {
  color: #6a7472;
}

.detail-box,
.json-box {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 18px;
  background: #f6f8f7;
}

.detail-box {
  display: grid;
  gap: 0.35rem;
  color: #566260;
}

.detail-box strong {
  color: #173937;
}

.form-grid {
  display: grid;
  gap: 0.85rem;
  margin: 1rem 0;
}

.form-grid label {
  display: grid;
  gap: 0.4rem;
  color: #566260;
}

.form-grid input {
  padding: 0.7rem 0.85rem;
  border-radius: 14px;
  border: 1px solid rgba(29, 59, 54, 0.12);
  background: white;
}

.json-box {
  overflow: auto;
  color: #244946;
  font-size: 0.92rem;
}

@media (max-width: 960px) {
  .hero-card,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
