<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { matchesPermissions, matchesRole } from '@/features/auth/permissions'
import { useAuthStore } from '@/features/auth/store'
import { useTaskStore } from '@/features/task/store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const taskStore = useTaskStore()

const { user } = storeToRefs(authStore)
const { pendingCount, completionRate } = storeToRefs(taskStore)

const showShell = computed(() => route.name !== 'login')

const navigationItems = computed(() =>
  router
    .getRoutes()
    .filter((item) => item.meta.menu)
    .filter(
      (item) =>
        matchesRole(authStore.role, item.meta.roles) &&
        matchesPermissions(authStore.permissions, item.meta.permissions),
    )
    .sort((left, right) => (Number(left.meta.menuOrder) || 0) - (Number(right.meta.menuOrder) || 0))
    .map((item) => ({
      name: item.name,
      path: item.path,
      title: String(item.meta.title ?? item.name ?? item.path),
    })),
)

const currentPageTitle = computed(() => String(route.meta.title ?? '控制台'))

const currentPageHint = computed(() => {
  if (route.name === 'home') {
    return '查看任务看板、权限差异和页面级操作。'
  }

  if (route.name === 'about') {
    return '浏览项目里的 TypeScript 练习和补充说明。'
  }

  if (route.name === 'taskCreate') {
    return '使用统一表单能力创建新的任务记录。'
  }

  if (route.name === 'truckList') {
    return '查看车辆列表、详情信息以及 AI 助手分析结果。'
  }

  return '浏览当前页面内容。'
})

async function handleLogout() {
  authStore.logout()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <RouterView v-if="!showShell" />

  <div v-else class="app-shell">
    <aside class="shell-sidebar">
      <div class="sidebar-brand">
        <p class="brand-tag">Vue 3 + TypeScript</p>
        <h1>后台演示台</h1>
        <p class="brand-copy">把路由、权限、请求和状态管理组合成一个可演示的小型后台。</p>
      </div>

      <section class="sidebar-card account-card">
        <div class="account-copy">
          <span>{{ user?.name ?? '访客' }}</span>
          <small>{{ authStore.role ?? 'guest' }}</small>
        </div>

        <button type="button" @click="handleLogout">退出登录</button>
      </section>

      <nav class="side-nav">
        <p class="nav-title">功能菜单</p>

        <RouterLink
          v-for="item in navigationItems"
          :key="String(item.name)"
          :to="item.path"
          class="nav-link"
        >
          <span class="nav-badge"></span>
          <span>{{ item.title }}</span>
        </RouterLink>
      </nav>

      <section class="sidebar-card stat-card">
        <p class="nav-title">看板概览</p>

        <div class="stat-grid">
          <div>
            <span>待办任务</span>
            <strong>{{ pendingCount }}</strong>
          </div>
          <div>
            <span>完成率</span>
            <strong>{{ completionRate }}%</strong>
          </div>
        </div>
      </section>
    </aside>

    <main class="shell-main">
      <header class="shell-topbar">
        <div>
          <p class="page-eyebrow">当前页面</p>
          <h2>{{ currentPageTitle }}</h2>
          <p class="page-hint">{{ currentPageHint }}</p>
        </div>

        <div class="topbar-summary">
          <span>当前账号</span>
          <strong>{{ user?.name ?? '访客' }}</strong>
        </div>
      </header>

      <section class="page-container">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 1.5rem;
  min-height: calc(100vh - 80px);
}

.shell-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 32px;
  border: 1px solid rgba(29, 59, 54, 0.12);
  background:
    radial-gradient(circle at top left, rgba(235, 166, 96, 0.22), transparent 28%),
    linear-gradient(180deg, #173937, #132c2b);
  color: #f8f3eb;
  position: sticky;
  top: 32px;
  height: fit-content;
}

.sidebar-brand h1 {
  margin-top: 0.35rem;
  font-size: 2rem;
  line-height: 1.1;
  font-weight: 700;
}

.brand-tag,
.nav-title,
.page-eyebrow {
  color: rgba(248, 243, 235, 0.76);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.76rem;
  font-weight: 700;
}

.brand-copy {
  margin-top: 0.75rem;
  color: rgba(248, 243, 235, 0.84);
  line-height: 1.6;
}

.sidebar-card {
  padding: 1rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.account-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.account-copy {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.account-copy span {
  font-size: 1.05rem;
  font-weight: 700;
}

.account-copy small {
  color: rgba(248, 243, 235, 0.76);
  text-transform: uppercase;
}

.account-card button {
  border: 0;
  border-radius: 999px;
  padding: 0.7rem 0.95rem;
  background: #f4e7d2;
  color: #173937;
  cursor: pointer;
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.85rem 0.95rem;
  border-radius: 18px;
  color: rgba(248, 243, 235, 0.88);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid transparent;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.09);
}

.nav-link.router-link-exact-active {
  color: #173937;
  background: #f4e7d2;
  border-color: rgba(244, 231, 210, 0.85);
}

.nav-badge {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.8;
}

.stat-card {
  margin-top: auto;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.85rem;
}

.stat-grid div {
  padding: 0.9rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
}

.stat-grid span {
  display: block;
  color: rgba(248, 243, 235, 0.74);
  font-size: 0.82rem;
}

.stat-grid strong {
  display: block;
  margin-top: 0.25rem;
  font-size: 1.55rem;
  font-weight: 700;
}

.shell-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.shell-topbar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 1.5rem;
  border-radius: 28px;
  border: 1px solid rgba(29, 59, 54, 0.12);
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 18px 40px rgba(19, 35, 33, 0.08);
}

.shell-topbar h2 {
  margin-top: 0.35rem;
  color: #173937;
  font-size: 1.9rem;
  font-weight: 700;
}

.page-eyebrow {
  color: #7a5d2d;
}

.page-hint {
  margin-top: 0.65rem;
  color: #556260;
}

.topbar-summary {
  min-width: 180px;
  padding: 1rem 1.1rem;
  border-radius: 22px;
  background: linear-gradient(180deg, #fcf2df, #f2dfbd);
}

.topbar-summary span {
  display: block;
  color: #7a5d2d;
  font-size: 0.85rem;
}

.topbar-summary strong {
  display: block;
  margin-top: 0.3rem;
  color: #173937;
  font-size: 1.25rem;
  font-weight: 700;
}

.page-container {
  min-width: 0;
}

@media (max-width: 980px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .shell-sidebar {
    position: static;
  }
}

@media (max-width: 720px) {
  .shell-topbar,
  .stat-grid {
    grid-template-columns: 1fr;
  }

  .shell-topbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
