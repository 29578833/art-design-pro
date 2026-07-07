import { AppRouteRecord } from '@/types/router'

export const recycleRoutes: AppRouteRecord = {
  path: '/recycle',
  name: 'Recycle',
  component: '/index/index',
  meta: {
    title: 'menus.recycle.title',
    icon: 'ri:recycle-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'customers',
      name: 'RecycleCustomers',
      component: '/recycle/recovery/customers',
      meta: {
        title: 'menus.recycle.customers',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    }
  ]
}
