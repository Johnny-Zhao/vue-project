import type { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login/index.vue'),
    meta: {
      requiresAuth: false,
      publicOnly: true,
      title: 'Login',
    },
  },
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/views/ForbiddenView.vue'),
    meta: {
      requiresAuth: true,
      title: '403 Forbidden',
    },
  },
]
