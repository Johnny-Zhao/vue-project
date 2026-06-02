import 'vue-router'
import type { AppPermission, UserRole } from '@/features/auth/types'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    publicOnly?: boolean
    title?: string
    menu?: boolean
    menuOrder?: number
    roles?: UserRole[]
    permissions?: AppPermission[]
  }
}
