import type { RouteRecordRaw } from 'vue-router'

export const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/express-playground',
    name: 'expressPlayground',
    component: () => import('@/views/ExpressPlaygroundView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Express 接口实验',
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
      title: 'Node SQLite CRUD',
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
      title: 'Node PostgreSQL CRUD',
      menu: true,
      menuOrder: 4,
      roles: ['admin', 'viewer'],
    },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: {
      requiresAuth: true,
      title: 'TypeScript Notes',
      menu: true,
      menuOrder: 5,
      roles: ['admin', 'viewer'],
    },
  },
]
