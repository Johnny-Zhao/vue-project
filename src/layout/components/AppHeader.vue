<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'

const route = useRoute()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

// 计算当前页面标题，保持顶部导航与路由元信息一致。
const currentPageTitle = computed(() => String(route.meta.title ?? '控制台'))

// 根据当前路由生成简短提示，让顶部说明更像业务后台导航条。
const currentPageHint = computed(() => {
  if (route.name === 'home') {
    return '查看任务看板、权限差异和整体链路状态'
  }

  if (route.name === 'about') {
    return '浏览项目说明、技术背景和补充记录'
  }

  if (route.name === 'taskCreate') {
    return '录入任务并演示统一表单与提交链路'
  }

  if (route.name === 'sqliteCrudPlayground') {
    return '演示 SQLite 版本的接口请求与增删改查流程'
  }

  if (route.name === 'postgresqlCrudPlayground') {
    return '演示 PostgreSQL 版本的接口请求与增删改查流程'
  }

  if (route.name === 'userManagement') {
    return '维护用户、角色和登录鉴权链路'
  }

  if (route.name === 'vehicleManagement') {
    return '维护车辆档案、AI 分析结果和审计留痕'
  }

  if (route.name === 'aiConfigManagement') {
    return '集中维护 AI 运行配置与开关策略'
  }

  if (route.name === 'auditLogManagement') {
    return '查看关键操作日志并追踪问题链路'
  }

  return '浏览当前模块内容'
})
</script>

<template>
  <header class="shell-topbar">
    <div class="topbar-left">
      <div class="title-group">
        <p class="page-label">业务控制台</p>
        <h2>{{ currentPageTitle }}</h2>
      </div>

      <p class="page-hint">{{ currentPageHint }}</p>
    </div>

    <div class="topbar-right">
      <div class="account-chip">
        <span>当前账号</span>
        <strong>{{ user?.name ?? '访客' }}</strong>
      </div>
    </div>
  </header>
</template>

<style scoped lang="less">
.shell-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 56px;
  padding: 0 18px;
  background: linear-gradient(90deg, #3b73d8 0%, #4d84e4 55%, #5d91eb 100%);
  color: #ffffff;
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.16);

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
    flex: 1;
  }

  .title-group {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    min-width: 0;
    flex-shrink: 0;

    .page-label {
      color: rgba(255, 255, 255, 0.72);
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    h2 {
      color: #ffffff;
      font-size: 1.15rem;
      font-weight: 700;
      line-height: 1;
      white-space: nowrap;
    }
  }

  .page-hint {
    min-width: 0;
    max-width: 620px;
    padding-left: 1rem;
    border-left: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.84);
    font-size: 0.82rem;
    line-height: 1.4;
  }

  .topbar-right {
    flex-shrink: 0;
  }

  .account-chip {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.38rem 0.7rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.14);

    span {
      color: rgba(255, 255, 255, 0.78);
      font-size: 0.76rem;
      white-space: nowrap;
    }

    strong {
      color: #ffffff;
      font-size: 0.88rem;
      font-weight: 700;
      white-space: nowrap;
    }
  }
}

@media (max-width: 900px) {
  .shell-topbar {
    align-items: flex-start;
    flex-direction: column;
    padding: 0.85rem 1rem;

    .topbar-left {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.55rem;
      width: 100%;
    }

    .title-group {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.3rem;
    }

    .page-hint {
      max-width: none;
      padding-left: 0;
      border-left: 0;
    }
  }
}
</style>
