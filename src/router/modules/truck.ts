import type { RouteRecordRaw } from 'vue-router'

export const truckRoutes: RouteRecordRaw[] = [
  {
    path: '/truck-list',
    name: 'truckList',
    component: () => import('@/views/TruckListView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Truck List',
      menu: true,
      menuOrder: 4,
      roles: ['admin'],
      permissions: ['truck:view'],
    },
  },
]
