<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'

const route = useRoute()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const currentPageTitle = computed(() => String(route.meta.title ?? '控制台'))

const currentPageHint = computed(() => {
  if (route.name === 'home') {
    return '查看任务看板、角色权限差异，以及页面级交互。'
  }

  if (route.name === 'about') {
    return '浏览项目里的 TypeScript 笔记和补充说明。'
  }

  if (route.name === 'taskCreate') {
    return '使用统一表单能力创建新的任务记录。'
  }

  if (route.name === 'truckList') {
    return '查看车辆列表、详情信息，以及 AI 辅助分析结果。'
  }

  if (route.name === 'sqliteCrudPlayground') {
    return '观察 SQLite 版本的请求链路和 CRUD 交互。'
  }

  if (route.name === 'postgresqlCrudPlayground') {
    return '观察 PostgreSQL 版本的请求链路和 CRUD 交互。'
  }

  if (route.name === 'userManagement') {
    return '维护 PostgreSQL 用户表，直接影响后端登录和 JWT 鉴权结果。'
  }

  return '浏览当前页面内容。'
})
</script>

<template>
  <header class="shell-topbar">
    <div class="topbar-main">
      <p class="page-eyebrow">当前页面</p>
      <h2>{{ currentPageTitle }}</h2>
      <p class="page-hint">{{ currentPageHint }}</p>
    </div>

    <div class="topbar-summary">
      <span>当前账号</span>
      <strong>{{ user?.name ?? '访客' }}</strong>
    </div>
  </header>
</template>

<style scoped>
.shell-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 10px 26px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
}

.topbar-main {
  min-width: 0;
}

.shell-topbar h2 {
  margin-top: 0.28rem;
  color: #0f172a;
  font-size: 1.45rem;
  line-height: 1.15;
  font-weight: 700;
}

.page-eyebrow {
  color: #2563eb;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.68rem;
  font-weight: 700;
}

.page-hint {
  margin-top: 0.52rem;
  max-width: 680px;
  color: #64748b;
  line-height: 1.55;
  font-size: 0.88rem;
}

.topbar-summary {
  min-width: 156px;
  padding: 0.78rem 0.88rem;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.topbar-summary span {
  display: block;
  color: #64748b;
  font-size: 0.76rem;
}

.topbar-summary strong {
  display: block;
  margin-top: 0.2rem;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 700;
}

@media (max-width: 720px) {
  .shell-topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar-summary {
    min-width: 0;
  }
}
</style>
