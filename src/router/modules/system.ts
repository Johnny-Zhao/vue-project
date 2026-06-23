import type { RouteRecordRaw } from 'vue-router'

export const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/express-playground',
    name: 'expressPlayground',
    component: () => import('@/views/ExpressPlaygroundView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Express Playground',
      menu: true,
      menuOrder: 2,
      roles: ['admin', 'viewer'],
    },
  },
  {
    path: '/sqlite-crud-playground',
    name: 'sqliteCrudPlayground',
    component: () => import('@/views/SqliteCrudPlaygroundView.vue'),
    meta: {
      requiresAuth: true,
      title: 'SQLite CRUD',
      menu: true,
      menuOrder: 3,
      roles: ['admin', 'viewer'],
    },
  },
  {
    path: '/postgresql-crud-playground',
    name: 'postgresqlCrudPlayground',
    component: () => import('@/views/PostgreSqlCrudPlayground/index.vue'),
    meta: {
      requiresAuth: true,
      title: 'PostgreSQL CRUD',
      menu: true,
      menuOrder: 4,
      roles: ['admin', 'viewer'],
    },
  },
  {
    path: '/ai-config-management',
    name: 'aiConfigManagement',
    component: () => import('@/views/AiConfigManagement/index.vue'),
    meta: {
      requiresAuth: true,
      title: 'AI 配置管理',
      menu: true,
      menuOrder: 6,
      roles: ['admin'],
      permissions: ['ai:config'],
    },
  },
  {
    path: '/user-management',
    name: 'userManagement',
    component: () => import('@/views/UserManagementView.vue'),
    meta: {
      requiresAuth: true,
      title: '用户管理',
      menu: true,
      menuOrder: 7,
      roles: ['admin'],
      permissions: ['user:manage'],
    },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: {
      requiresAuth: true,
      title: 'TypeScript 笔记',
      menu: true,
      menuOrder: 8,
      roles: ['admin', 'viewer'],
    },
  },
]
