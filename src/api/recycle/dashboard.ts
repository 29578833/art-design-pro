import request from '@/utils/http'
import type { DashboardStatistics, DashboardTimeType } from '@/types/recycle/dashboard'

/** 数据看板统计 */
export function fetchDashboardStatistics(timeType: DashboardTimeType = 'month') {
  return request.get<DashboardStatistics>({
    url: '/scrap/statistics/index',
    params: { time_type: timeType }
  })
}
