import request from '@/utils/http'
import type {
  QualityQueueItem,
  QualityQueueList,
  QualityQueueParams,
  QualityReportItem,
  QualityReportList,
  QualitySearchParams,
  QualityDetail,
  QualityStats,
  QualityCreateParams,
  QualityCreateResult,
  QualityCreateByPlateResult,
  QualityUpdateParams,
  QualityBatchAuditParams,
  InspectionCategory
} from '@/types/recycle/quality'

// ==================== 分页辅助 ====================

function resolvePagination(params: {
  current?: number
  size?: number
  page?: number
  limit?: number
}) {
  return {
    page: Number(params.page ?? params.current ?? 1),
    limit: Number(params.limit ?? params.size ?? 20)
  }
}

// ==================== 质检队列 ====================

/** 构建队列列表请求参数（字段与后端 getMore 一致） */
function buildQueueParams(params: QualityQueueParams) {
  const { page, limit } = resolvePagination(params)
  return {
    page,
    limit,
    keyword: params.keyword?.trim() || '',
    queue_status: params.queue_status || ''
  }
}

/** 质检队列列表 */
export async function fetchQualityQueue(params: QualityQueueParams): Promise<QualityQueueList> {
  const query = buildQueueParams(params)
  const res = await request.get<{ list: QualityQueueItem[]; count: number }>({
    url: '/scrap/quality/queue',
    params: query
  })
  return {
    records: res.list || [],
    total: res.count || 0,
    current: query.page,
    size: query.limit
  }
}

/** 质检队列统计 */
export async function fetchQualityStats(): Promise<QualityStats> {
  const res = await request.get<QualityStats>({
    url: '/scrap/quality/stats'
  })
  return {
    pending: res.pending || 0,
    overdue: res.overdue || 0,
    in_progress: res.in_progress || 0,
    today_completed: res.today_completed || 0,
    avg_hours: res.avg_hours || 0
  }
}

// ==================== 质检报告列表 ====================

/** 构建报告列表请求参数（字段与后端 getMore 一致） */
function buildReportListParams(params: QualitySearchParams) {
  const { page, limit } = resolvePagination(params)
  return {
    page,
    limit,
    keyword: params.keyword?.trim() || '',
    order_id: params.order_id || '',
    plate_no: params.plate_no?.trim() || '',
    result: params.result !== undefined && params.result !== '' ? params.result : ''
  }
}

/** 质检报告列表 */
export async function fetchQualityReportList(
  params: QualitySearchParams
): Promise<QualityReportList> {
  const query = buildReportListParams(params)
  const res = await request.get<{ list: QualityReportItem[]; count: number }>({
    url: '/scrap/quality/list',
    params: query
  })
  return {
    records: res.list || [],
    total: res.count || 0,
    current: query.page,
    size: query.limit
  }
}

// ==================== 质检详情 ====================

/** 质检详情 */
export async function fetchQualityDetail(id: number): Promise<QualityDetail> {
  return request.get<QualityDetail>({
    url: `/scrap/quality/detail/${id}`
  })
}

/** 按订单获取质检记录（回显 / 继续质检） */
export async function fetchQualityByOrder(orderId: number, vehicleId?: number) {
  const res = await request.get<QualityDetail | unknown>({
    url: '/scrap/quality/get_by_order',
    params: {
      order_id: orderId,
      vehicle_id: vehicleId || 0
    }
  })
  if (!res || typeof res !== 'object' || !('id' in res) || !(res as QualityDetail).id) {
    return null
  }
  return res as QualityDetail
}

// ==================== 质检创建/更新 ====================

/** 创建质检记录（步骤1） */
export async function createQuality(
  data: QualityCreateParams,
  options?: { showSuccessMessage?: boolean }
) {
  return request.post<QualityCreateResult>({
    url: '/scrap/quality/create',
    params: data,
    showSuccessMessage: options?.showSuccessMessage ?? true
  })
}

/** 按车牌号创建质检单（同步建订单/车辆档案） */
export async function fetchCreateQualityByPlate(plateNo: string) {
  return request.post<QualityCreateByPlateResult>({
    url: '/scrap/quality/create_by_plate',
    params: { plate_no: plateNo },
    showSuccessMessage: true
  })
}

/** 更新质检记录（步骤2或步骤3） */
export async function updateQuality(
  data: QualityUpdateParams,
  options?: { showSuccessMessage?: boolean }
) {
  return request.post({
    url: '/scrap/quality/update',
    params: data,
    showSuccessMessage: options?.showSuccessMessage ?? true
  })
}

// ==================== 质检项目 ====================

/** 获取质检项目分类及项目 */
export async function fetchInspectionItems() {
  return request.get<InspectionCategory[]>({
    url: '/scrap/inspection/items'
  })
}

// ==================== 批量审核 ====================

/** 批量审核质检 */
export async function batchAuditQuality(data: QualityBatchAuditParams) {
  return request.post({
    url: '/scrap/quality/batch_audit',
    params: data,
    showSuccessMessage: true
  })
}

// ==================== PDF ====================

/** 预览/下载质检报告 PDF */
export async function previewQualityPdf(checkId: number) {
  return request.get<{ url: string }>({
    url: '/scrap/quality/preview_pdf',
    params: { id: checkId }
  })
}
