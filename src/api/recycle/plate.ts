import request from '@/utils/http'
import type {
  DismantleInitData,
  DismantleLogResult,
  DismantleSaveParams,
  PlateCreateParams,
  PlateItem,
  PlateSearchParams,
  PlateStats,
  PlateStatus,
  PreprocessSaveParams,
  PreprocessStepOption
} from '@/types/recycle/plate'

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

function resolveStatusParam(status?: PlateSearchParams['status']) {
  if (status === undefined || status === '') return ''
  if (status === 'pending' || status === 'completed') return status
  if (status === 0) return 'pending'
  if (status === 1) return 'completed'
  return String(status)
}

function buildListParams(params: PlateSearchParams) {
  const { page, limit } = resolvePagination(params)
  return {
    page,
    limit,
    keyword: params.keyword?.trim() || '',
    status: resolveStatusParam(params.status),
    priority: params.priority || '',
    start_date: params.start_date || '',
    end_date: params.end_date || ''
  }
}

/** 拆解工单列表 */
export async function fetchPlateList(params: PlateSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<{ list: PlateItem[]; count: number }>({
    url: '/scrap/plate/list',
    params: {
      page: query.page,
      limit: query.limit,
      keyword: query.keyword,
      status: query.status,
      priority: query.priority,
      start_date: query.start_date,
      end_date: query.end_date
    }
  })

  return {
    records: res.list || [],
    total: res.count || 0,
    current: query.page,
    size: query.limit
  }
}

/** 拆解统计 */
export async function fetchPlateCounts(): Promise<PlateStats> {
  const res = await request.get<PlateStats>({
    url: '/scrap/plate/counts'
  })
  return {
    pending: res.pending || 0,
    preprocess_done: res.preprocess_done || 0,
    completed: res.completed || 0,
    monthly: res.monthly || 0
  }
}

/** 拆解工单详情 */
export function fetchPlateDetail(id: number) {
  return request.get<PlateItem>({
    url: `/scrap/plate/detail/${id}`
  })
}

/** 新建拆解工单 */
export function fetchPlateCreate(data: PlateCreateParams) {
  return request.post({
    url: '/scrap/plate/create',
    params: data,
    showSuccessMessage: true
  })
}

/** 更新拆解工单 */
export function fetchPlateUpdate(id: number, data: Partial<PlateCreateParams>) {
  return request.post({
    url: `/scrap/plate/update/${id}`,
    params: data,
    showSuccessMessage: true
  })
}

/** 更新工单状态 */
export function fetchPlateUpdateStatus(id: number, status: PlateStatus, progress = 0) {
  return request.post({
    url: `/scrap/plate/update_status/${id}`,
    params: { status, progress },
    showSuccessMessage: true
  })
}

/** 导出拆解工单 */
export async function fetchPlateExport(params: PlateSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<PlateItem[]>({
    url: '/scrap/plate/export',
    params: {
      keyword: query.keyword,
      status: query.status,
      priority: query.priority,
      start_date: query.start_date,
      end_date: query.end_date
    }
  })
  return Array.isArray(res) ? res : []
}

/** 拆解初始化数据 */
export function fetchDismantleInit(plateId: number) {
  return request.get<DismantleInitData>({
    url: `/scrap/plate/dismantle_init/${plateId}`
  })
}

/** 保存拆解数据 */
export function fetchDismantleSave(plateId: number, data: DismantleSaveParams) {
  return request.post({
    url: `/scrap/plate/dismantle_save/${plateId}`,
    params: data,
    showSuccessMessage: true
  })
}

/** 预处理步骤列表 */
export function fetchPreprocessStepList() {
  return request.get<PreprocessStepOption[]>({
    url: '/scrap/preprocess_step/list'
  })
}

/** 预处理工序完成 */
export function fetchPlatePreprocess(data: PreprocessSaveParams) {
  return request.post({
    url: '/scrap/plate/preprocess',
    params: data,
    showSuccessMessage: true
  })
}

/** 拆解操作日志 */
export function fetchDismantleLog(plateId: number) {
  return request.get<DismantleLogResult>({
    url: `/scrap/plate/dismantle_log/${plateId}`
  })
}
