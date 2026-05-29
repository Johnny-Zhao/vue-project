<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from 'vue-router'
import { useCounterStore } from './stores/counter'

const careerPlanStore = useCounterStore()
const { pendingCount, completionRate } = storeToRefs(careerPlanStore)
</script>

<template>
  <div class="app-shell">
    <header class="shell-header">
      <div>
        <p class="eyebrow">Vue 3 + TypeScript + Pinia</p>
        <h1>前端转型学习面板</h1>
        <p class="subtitle">
          这个小例子把路由、全局状态、组件数据展示串在一起，比默认模板更接近真实业务页面。
        </p>
      </div>

      <div class="header-stats">
        <div class="stat-chip">
          <span>待推进</span>
          <strong>{{ pendingCount }}</strong>
        </div>
        <div class="stat-chip">
          <span>完成率</span>
          <strong>{{ completionRate }}%</strong>
        </div>
      </div>
    </header>

    <nav class="main-nav">
      <RouterLink to="/">学习看板</RouterLink>
      <RouterLink to="/about">TS / Pinia 说明</RouterLink>
      <RouterLink to="/task-create">创建任务</RouterLink>
      <RouterLink to="/truck-list">真实接口表格</RouterLink>
    </nav>

    <RouterView />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.shell-header {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.75rem;
  border: 1px solid rgba(29, 59, 54, 0.12);
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(235, 166, 96, 0.28), transparent 30%),
    linear-gradient(135deg, rgba(16, 73, 63, 0.95), rgba(28, 39, 58, 0.96));
  color: #f8f3eb;
}

.eyebrow {
  margin-bottom: 0.5rem;
  color: rgba(248, 243, 235, 0.76);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.shell-header h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
}

.subtitle {
  max-width: 42rem;
  margin-top: 0.75rem;
  color: rgba(248, 243, 235, 0.84);
}

.header-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  gap: 1rem;
  min-width: 260px;
}

.stat-chip {
  padding: 1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.stat-chip span {
  display: block;
  color: rgba(248, 243, 235, 0.76);
  font-size: 0.85rem;
}

.stat-chip strong {
  display: block;
  margin-top: 0.25rem;
  font-size: 1.8rem;
  font-weight: 700;
}

.main-nav {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.main-nav a {
  padding: 0.75rem 1rem;
  border-radius: 999px;
  color: var(--color-heading);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(29, 59, 54, 0.1);
}

.main-nav a.router-link-exact-active {
  background: #163f38;
  color: #f8f3eb;
}

@media (max-width: 720px) {
  .shell-header {
    flex-direction: column;
  }

  .header-stats {
    min-width: 100%;
  }
}
</style>
