import request from '@/utils/http'
import type {
  DismantleParams,
  DismantleResult,
  FinancialSettlementParams,
  FinancialSettlementResult,
  MaterialDailyParams,
  MaterialDailyResult,
  MaterialInOutParams,
  MaterialInOutResult,
  PhotoChecklistParams,
  PhotoChecklistResult,
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

/** 原料出入库清单 */
export function fetchMaterialInOut(params?: MaterialInOutParams) {
  return request.get<MaterialInOutResult>({
    url: '/scrap/report/material_in_out',
    params: {
      plate_no: params?.plate_no || '',
      internal_no: params?.internal_no || '',
      vin: params?.vin || '',
      owner: params?.owner || '',
      entry_no: params?.entry_no || '',
      business: params?.business || '',
      vehicle_category: params?.vehicle_category || '',
      vehicle_model: params?.vehicle_model || '',
      drive_type: params?.drive_type || '',
      supervision: params?.supervision || '',
      start_date: params?.start_date || '',
      end_date: params?.end_date || '',
      material_start_date: params?.material_start_date || '',
      material_end_date: params?.material_end_date || '',
      page: params?.page || 1,
      limit: params?.limit || 20
    }
  })
}

/** 原料日报表 */
export function fetchMaterialDaily(params?: MaterialDailyParams) {
  return request.get<MaterialDailyResult>({
    url: '/scrap/report/material_daily',
    params: {
      keyword: params?.keyword || '',
      vehicle_category: params?.vehicle_category || '',
      start_date: params?.start_date || '',
      end_date: params?.end_date || '',
      time_mode: params?.time_mode || 'day',
      page: params?.page || 1,
      limit: params?.limit || 25
    }
  })
}

/** 报废车拆解报表 */
export function fetchDismantleReport(params?: DismantleParams) {
  return request.get<DismantleResult>({
    url: '/scrap/report/dismantle',
    params: {
      keyword: params?.keyword || '',
      vehicle_category: params?.vehicle_category || '',
      start_date: params?.start_date || '',
      end_date: params?.end_date || '',
      time_mode: params?.time_mode || 'day',
      page: params?.page || 1,
      limit: params?.limit || 20
    }
  })
}

/** 机动车报废拆解清单 */
export function fetchPhotoChecklist(params?: PhotoChecklistParams) {
  return request.get<PhotoChecklistResult>({
    url: '/scrap/report/photo_checklist',
    params: {
      plate_no: params?.plate_no || '',
      start_date: params?.start_date || '',
      end_date: params?.end_date || '',
      time_mode: params?.time_mode || 'month',
      page: params?.page || 1,
      limit: params?.limit || 20
    }
  })
}

/** 财务结算申请表 */
export function fetchFinancialSettlement(params?: FinancialSettlementParams) {
  return request.get<FinancialSettlementResult>({
    url: '/scrap/report/financial_settlement',
    params: {
      plate_no: params?.plate_no || '',
      vin: params?.vin || '',
      vehicle_no: params?.vehicle_no || '',
      my_vehicle_model: params?.my_vehicle_model || '',
      owner: params?.owner || '',
      agent_name: params?.agent_name || '',
      agent_phone: params?.agent_phone || '',
      warehouse_no: params?.warehouse_no || '',
      archive_no: params?.archive_no || '',
      order_no: params?.order_no || '',
      vehicle_category: params?.vehicle_category || '',
      remark: params?.remark || '',
      entry_start_date: params?.entry_start_date || '',
      entry_end_date: params?.entry_end_date || '',
      archive_start_date: params?.archive_start_date || '',
      archive_end_date: params?.archive_end_date || '',
      order_start_date: params?.order_start_date || '',
      order_end_date: params?.order_end_date || '',
      time_mode: params?.time_mode || 'month',
      page: params?.page || 1,
      limit: params?.limit || 20
    }
  })
}

/** 照片清单 Excel / ZIP 下载（后端直接输出文件） */
export function buildPhotoChecklistFileUrl(
  path: 'photo_checklist_export' | 'photo_checklist_photos',
  params?: PhotoChecklistParams
) {
  const qs = new URLSearchParams()
  qs.set('plate_no', params?.plate_no || '')
  qs.set('start_date', params?.start_date || '')
  qs.set('end_date', params?.end_date || '')
  qs.set('time_mode', params?.time_mode || 'month')
  const base = import.meta.env.VITE_API_URL || ''
  return `${base}/scrap/report/${path}?${qs.toString()}`
}
