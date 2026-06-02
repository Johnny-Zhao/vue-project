<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
import { matchesPermissions, matchesRole } from '@/features/auth/permissions'
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
      title: item.meta.title ?? String(item.name ?? item.path),
    })),
)

async function handleLogout() {
  authStore.logout()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <RouterView v-if="!showShell" />

  <div v-else class="app-shell">
    <header class="shell-header">
      <div>
        <p class="eyebrow">Vue 3 + TypeScript + Auth</p>
        <h1>Engineering Demo Console</h1>
        <p class="subtitle">
          This app wires request handling, authentication, routing, and state together like a small admin system.
        </p>
      </div>

      <div class="header-side">
        <div class="header-stats">
          <div class="stat-chip">
            <span>Pending Tasks</span>
            <strong>{{ pendingCount }}</strong>
          </div>
          <div class="stat-chip">
            <span>Completion</span>
            <strong>{{ completionRate }}%</strong>
          </div>
        </div>

        <div class="account-panel">
          <div class="account-copy">
            <span>{{ user?.name ?? 'Guest' }}</span>
            <small>{{ authStore.role ?? 'guest' }}</small>
          </div>
          <button type="button" @click="handleLogout">Sign Out</button>
        </div>
      </div>
    </header>

    <nav class="main-nav">
      <RouterLink v-for="item in navigationItems" :key="String(item.name)" :to="item.path">
        {{ item.title }}
      </RouterLink>
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

.header-side {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 320px;
}

.header-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  gap: 1rem;
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

.account-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
}

.account-copy {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.account-copy small {
  color: rgba(248, 243, 235, 0.72);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.account-panel button {
  border: 0;
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  background: #f4e7d2;
  color: #173937;
  cursor: pointer;
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

  .header-side,
  .header-stats {
    min-width: 100%;
  }

  .account-panel {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
