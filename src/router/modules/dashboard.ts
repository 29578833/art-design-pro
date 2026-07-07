import { AppRouteRecord } from '@/types/router'

/** 数据看板（一级路由） */
export const dashboardRoutes: AppRouteRecord = {
  name: 'Console',
  path: '/dashboard/console',
  component: '/dashboard/console',
  meta: {
    title: 'menus.dashboard.title',
    icon: 'ri:pie-chart-line',
    keepAlive: false,
    fixedTab: true,
    menuId: 7
  }
}
