import type { RouteRecordRaw } from 'vue-router'

export const taskRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Task Board',
      menu: true,
      menuOrder: 1,
      roles: ['admin', 'viewer'],
    },
  },
  {
    path: '/task-create',
    name: 'taskCreate',
    component: () => import('@/views/TaskCreateView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Create Task',
      menu: true,
      menuOrder: 3,
      roles: ['admin'],
      permissions: ['task:create'],
    },
  },
]
