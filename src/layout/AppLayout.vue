<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
</script>

<template>
  <div class="app-layout">
    <AppSidebar class="layout-sidebar" />

    <main class="layout-main">
      <AppHeader />

      <section class="page-container">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<style scoped lang="less">
.app-layout {
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr);
  min-height: 100vh;
  background: #eef3fb;

  .layout-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: #f5f7fb;
    border-left: 1px solid #d6e1f2;
  }

  .page-container {
    min-width: 0;
    flex: 1;
    padding: 10px 12px 14px;
    overflow: auto;
  }
}

.app-layout :deep(.shell-sidebar) {
  gap: 0.75rem;
  padding: 0.9rem 0.75rem;
  border-radius: 0;
  box-shadow: none;
  top: 0;
  min-height: 100vh;
  background: linear-gradient(180deg, #0f2b57 0%, #133667 28%, #102c54 100%);
}

.app-layout :deep(.sidebar-brand) {
  padding: 0 0.35rem 0.3rem;
}

.app-layout :deep(.sidebar-brand h1) {
  font-size: 1.18rem;
}

.app-layout :deep(.brand-copy) {
  margin-top: 0.45rem;
  font-size: 0.8rem;
  line-height: 1.45;
}

.app-layout :deep(.sidebar-card) {
  padding: 0.75rem;
  border-radius: 4px;
  backdrop-filter: none;
}

.app-layout :deep(.account-card button) {
  border-radius: 3px;
  padding: 0.55rem 0.7rem;
}

.app-layout :deep(.side-menu-item) {
  margin-top: 0.18rem;
  min-height: 36px;
  border-radius: 3px;
  font-size: 0.88rem;
}

.app-layout :deep(.stat-grid div) {
  border-radius: 3px;
}

.app-layout :deep(.vehicle-page) {
  gap: 0.9rem;
}

.app-layout :deep(.page-head),
.app-layout :deep(.page-note),
.app-layout :deep(.detail-header),
.app-layout :deep(.assistant-shell),
.app-layout :deep(.ai-head-card),
.app-layout :deep(.ai-panel),
.app-layout :deep(.ai-detail-card),
.app-layout :deep(.ai-runtime-card),
.app-layout :deep(.error-banner),
.app-layout :deep(.ai-placeholder),
.app-layout :deep(.ai-error),
.app-layout :deep(.ai-notice) {
  border-radius: 4px;
  box-shadow: none;
}

.app-layout :deep(.page-head),
.app-layout :deep(.page-note),
.app-layout :deep(.detail-header),
.app-layout :deep(.assistant-shell),
.app-layout :deep(.ai-head-card),
.app-layout :deep(.ai-panel),
.app-layout :deep(.ai-runtime-card) {
  border-color: #d8e2f0;
}

.app-layout :deep(.detail-card),
.app-layout :deep(.ai-detail-card),
.app-layout :deep(.ai-runtime-item) {
  border-radius: 3px;
}

.app-layout :deep(.el-table),
.app-layout :deep(.el-input__wrapper),
.app-layout :deep(.el-textarea__wrapper),
.app-layout :deep(.el-select__wrapper),
.app-layout :deep(.el-button),
.app-layout :deep(.el-pagination button),
.app-layout :deep(.el-pager li) {
  border-radius: 3px;
}

@media (max-width: 980px) {
  .app-layout {
    grid-template-columns: 1fr;

    .layout-main {
      border-left: 0;
    }

    .page-container {
      padding: 0.75rem;
    }
  }

  .app-layout :deep(.shell-sidebar) {
    min-height: auto;
    position: static;
  }
}
</style>
