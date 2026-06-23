import type { RouteRecordRaw } from 'vue-router'

export const auditLogRoutes: RouteRecordRaw[] = [
  {
    path: '/audit-log-management',
    name: 'auditLogManagement',
    component: () => import('@/views/AuditLogManagement/index.vue'),
    meta: {
      requiresAuth: true,
      title: '操作日志',
      menu: true,
      menuOrder: 6,
      roles: ['admin'],
    },
  },
]
