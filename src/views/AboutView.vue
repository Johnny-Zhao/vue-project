<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const careerPlanStore = useCounterStore()
const { completionRate, filteredTasks, summaryCards, weeklyFocusHours } = storeToRefs(careerPlanStore)
</script>

<template>
  <section class="about-page">
    <article class="about-card">
      <p class="section-label">为什么这里能说明 Pinia 在工作</p>
      <h2>你在首页点过的状态，这里会直接读到同一份数据</h2>
      <p class="copy">
        这就是全局状态管理和组件局部状态最大的区别。如果这些数据只写在首页组件里，切到这个路由后就拿不到。
      </p>

      <div class="shared-grid">
        <div v-for="card in summaryCards" :key="card.label" class="shared-card">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <p>{{ card.hint }}</p>
        </div>
      </div>
    </article>

    <div class="detail-grid">
      <article class="panel">
        <p class="section-label">TS 写法拆解</p>
        <h3>这个项目里你已经用上的几种 TypeScript 语义</h3>
        <ul class="note-list">
          <li>
            `type StudyStatus = 'todo' | 'doing' | 'done'`
            是联合类型，限制状态只能是这 3 个值。
          </li>
          <li>
            `interface StudyTask` 用来描述任务对象的完整结构，适合给数组元素、接口数据、配置对象建模。
          </li>
          <li>
            `ref&lt;StudyTask[]&gt;(initialTasks)` 是给响应式状态一个明确的数组类型。
          </li>
          <li>
            `computed(() =&gt; ...)` 返回的是派生数据，不需要手动同步。
          </li>
          <li>
            `Record&lt;StudyStatus, string&gt;` 表示“每一种状态都必须有对应文本”。
          </li>
        </ul>
      </article>

      <article class="panel">
        <p class="section-label">当前共享状态</p>
        <h3>跨页面读取 store 的即时结果</h3>
        <div class="snapshot">
          <div>
            <span>完成率</span>
            <strong>{{ completionRate }}%</strong>
          </div>
          <div>
            <span>筛选结果数</span>
            <strong>{{ filteredTasks.length }}</strong>
          </div>
          <div>
            <span>本周专注时长</span>
            <strong>{{ weeklyFocusHours }}h</strong>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.about-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.about-card,
.panel {
  padding: 1.5rem;
  border-radius: 28px;
  border: 1px solid rgba(29, 59, 54, 0.1);
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 18px 40px rgba(19, 35, 33, 0.08);
}

.section-label {
  color: #7a5d2d;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.76rem;
  font-weight: 700;
}

.about-card h2,
.panel h3 {
  margin-top: 0.4rem;
  color: #16302f;
  font-size: 1.5rem;
  font-weight: 700;
}

.copy {
  margin-top: 0.75rem;
  max-width: 48rem;
  color: #4d5a58;
}

.shared-grid,
.detail-grid,
.snapshot {
  display: grid;
  gap: 1rem;
}

.shared-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 1.25rem;
}

.shared-card {
  padding: 1rem;
  border-radius: 22px;
  background: #f5f7f6;
}

.shared-card span,
.shared-card p,
.note-list {
  color: #53605e;
}

.shared-card strong {
  display: block;
  margin: 0.35rem 0 0.5rem;
  color: #173937;
  font-size: 1.8rem;
  font-weight: 700;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.note-list {
  margin-top: 1rem;
  padding-left: 1.2rem;
  display: grid;
  gap: 0.85rem;
}

.snapshot {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 1rem;
}

.snapshot div {
  padding: 1rem;
  border-radius: 20px;
  background: #efe5d1;
}

.snapshot span {
  color: #7a5d2d;
  font-size: 0.82rem;
}

.snapshot strong {
  display: block;
  margin-top: 0.25rem;
  color: #173937;
  font-size: 1.7rem;
  font-weight: 700;
}

@media (max-width: 960px) {
  .shared-grid,
  .detail-grid,
  .snapshot {
    grid-template-columns: 1fr;
  }
}
</style>
