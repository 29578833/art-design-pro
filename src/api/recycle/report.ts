import request from '@/utils/http'
import type {
  DecisionStatistics,
  QualityInspectionParams,
  QualityInspectionResult,
  ReportDateParams,
  SalesPerformanceResult,
  ScrapSummaryResult,
  VehicleArchiveParams,
  VehicleArchiveResult
} from '@/types/recycle/decision/reports/report'

/** 收车汇总报表 */
export function fetchScrapSummary(params?: ReportDateParams) {
  return request.get<ScrapSummaryResult>({
    url: '/scrap/report/scrap_summary',
    params: {
      start_date: params?.start_date || '',
      end_date: params?.end_date || ''
    }
  })
}

/** 业务员绩效报表 */
export function fetchSalesPerformance(params?: ReportDateParams) {
  return request.get<SalesPerformanceResult>({
    url: '/scrap/report/sales_performance',
    params: {
      start_date: params?.start_date || '',
      end_date: params?.end_date || ''
    }
  })
}

/** 车辆档案信息汇总表 */
export function fetchVehicleArchive(params?: VehicleArchiveParams) {
  return request.get<VehicleArchiveResult>({
    url: '/scrap/report/vehicle_archive',
    params: {
      keyword: params?.keyword || '',
      start_date: params?.start_date || '',
      end_date: params?.end_date || '',
      type: params?.type || 'car',
      progress_status: params?.progress_status || '',
      page: params?.page || 1,
      limit: params?.limit || 20
    }
  })
}

/** 报废车辆质检汇总表 */
export function fetchQualityInspection(params?: QualityInspectionParams) {
  return request.get<QualityInspectionResult>({
    url: '/scrap/report/quality_inspection',
    params: {
      keyword: params?.keyword || '',
      start_date: params?.start_date || '',
      end_date: params?.end_date || '',
      agent_name: params?.agent_name || '',
      inspector_name: params?.inspector_name || '',
      qc_status: params?.qc_status || '',
      emission_standard: params?.emission_standard || '',
      fuel_type: params?.fuel_type || '',
      owner_type: params?.owner_type || '',
      vehicle_category: params?.vehicle_category || '',
      page: params?.page || 1,
      limit: params?.limit || 10
    }
  })
}

/** 数据决策看板统计（趋势） */
export function fetchDecisionStatistics(timeType = 'month') {
  return request.get<DecisionStatistics>({
    url: '/scrap/statistics/index',
    params: { time_type: timeType }
  })
}
