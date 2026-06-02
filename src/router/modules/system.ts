import type { RouteRecordRaw } from 'vue-router'

export const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: {
      requiresAuth: true,
      title: 'TypeScript Notes',
      menu: true,
      menuOrder: 2,
      roles: ['admin', 'viewer'],
    },
  },
]
