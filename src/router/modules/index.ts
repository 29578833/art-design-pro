import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { recycleRoutes } from './recycle'
import { systemRoutes } from './system'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  recycleRoutes,
  systemRoutes,
  resultRoutes,
  exceptionRoutes
]
