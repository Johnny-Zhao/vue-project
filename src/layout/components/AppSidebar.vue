<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { matchesPermissions, matchesRole } from '@/features/auth/permissions'
import { useAuthStore } from '@/features/auth/store'
import { useTaskStore } from '@/features/task/store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const taskStore = useTaskStore()

const { user } = storeToRefs(authStore)
const { pendingCount, completionRate } = storeToRefs(taskStore)

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

async function handleLogout() {
  authStore.logout()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <aside class="shell-sidebar">
    <div class="sidebar-brand">
      <p class="brand-tag">Workspace</p>
      <h1>后台练习台</h1>
      <p class="brand-copy">把路由、权限、接口请求和数据库练习放进一个更清晰的后台壳子里。</p>
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

      <el-menu
        :default-active="route.path"
        class="side-menu"
        router
        background-color="transparent"
        text-color="#cbd5e1"
        active-text-color="#0f172a"
      >
        <el-menu-item
          v-for="item in navigationItems"
          :key="String(item.name)"
          :index="item.path"
          class="side-menu-item"
        >
          <span class="nav-badge"></span>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </nav>

    <section class="sidebar-card stat-card">
      <p class="nav-title">任务概览</p>

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
</template>

<style scoped>
.shell-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem;
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 28%),
    linear-gradient(180deg, #0f172a, #111827 52%, #172033);
  color: #f8fafc;
  position: sticky;
  top: 18px;
  height: fit-content;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
}

.sidebar-brand h1 {
  margin-top: 0.3rem;
  font-size: 1.45rem;
  line-height: 1.15;
  font-weight: 700;
}

.brand-tag,
.nav-title {
  color: rgba(203, 213, 225, 0.72);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.68rem;
  font-weight: 700;
}

.brand-copy {
  margin-top: 0.65rem;
  color: rgba(226, 232, 240, 0.78);
  line-height: 1.55;
  font-size: 0.88rem;
}

.sidebar-card {
  padding: 0.9rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.12);
  backdrop-filter: blur(10px);
}

.account-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.account-copy {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.account-copy span {
  font-size: 0.96rem;
  font-weight: 700;
}

.account-copy small {
  color: rgba(203, 213, 225, 0.72);
  text-transform: uppercase;
  font-size: 0.72rem;
}

.account-card button {
  border: 0;
  border-radius: 999px;
  padding: 0.62rem 0.9rem;
  background: linear-gradient(180deg, #f8fafc, #e2e8f0);
  color: #0f172a;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.side-menu {
  border-right: 0;
  background: transparent;
}

.side-menu-item {
  gap: 0.7rem;
  margin-top: 0.24rem;
  border-radius: 12px;
  min-height: 40px;
  font-size: 0.92rem;
  background: rgba(255, 255, 255, 0.02);
}

:deep(.side-menu .el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08);
}

:deep(.side-menu .el-menu-item.is-active) {
  background: linear-gradient(180deg, #f8fafc, #e2e8f0);
  color: #0f172a;
}

.nav-badge {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.85;
}

.stat-card {
  margin-top: auto;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.7rem;
}

.stat-grid div {
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
}

.stat-grid span {
  display: block;
  color: rgba(203, 213, 225, 0.74);
  font-size: 0.76rem;
}

.stat-grid strong {
  display: block;
  margin-top: 0.22rem;
  font-size: 1.2rem;
  font-weight: 700;
}

@media (max-width: 980px) {
  .shell-sidebar {
    position: static;
  }
}
</style>
