import type { RouteRecordRaw } from 'vue-router'

export const vehicleRoutes: RouteRecordRaw[] = [
  {
    path: '/vehicle-management',
    name: 'vehicleManagement',
    component: () => import('@/views/VehicleManagement/index.vue'),
    meta: {
      requiresAuth: true,
      title: '车辆管理',
      menu: true,
      menuOrder: 5,
    },
  },
]
