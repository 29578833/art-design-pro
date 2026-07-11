import request from '@/utils/http'
import type {
  MaterialBatchOutboundResult,
  MaterialItem,
  MaterialOutboundParams,
  MaterialReturnParams,
  MaterialSearchParams,
  MaterialStaffOption,
  MaterialStats,
  MaterialStatusOption
} from '@/types/recycle/material'

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

function buildListParams(params: MaterialSearchParams) {
  const { page, limit } = resolvePagination(params)
  return {
    page,
    limit,
    keyword: params.keyword?.trim() || '',
    status: params.status !== undefined && params.status !== '' ? params.status : '',
    warehouse_area_id: params.warehouse_area_id || ''
  }
}

/** 领料列表 */
export async function fetchMaterialList(params: MaterialSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<{ list: MaterialItem[]; count: number }>({
    url: '/scrap/material/list',
    params: query
  })
  return {
    records: res.list || [],
    total: res.count || 0,
    current: query.page,
    size: query.limit
  }
}

/** 领料统计 */
export async function fetchMaterialStats(): Promise<MaterialStats> {
  const res = await request.get<MaterialStats>({
    url: '/scrap/material/stats'
  })
  return {
    pending_count: res.pending_count || 0,
    completed_count: res.completed_count || 0,
    today_count: res.today_count || 0
  }
}

/** 领料员工列表 */
export async function fetchMaterialStaffList() {
  return request.get<MaterialStaffOption[]>({
    url: '/scrap/material/staff_list'
  })
}

/** 领料状态选项 */
export async function fetchMaterialStatusOptions() {
  return request.get<MaterialStatusOption[]>({
    url: '/scrap/material/status_options'
  })
}

/** 领料出库（支持单条或批量，id 多个逗号分隔） */
export async function fetchMaterialOutbound(
  data: MaterialOutboundParams,
  options?: { showSuccessMessage?: boolean }
) {
  const id = typeof data.id === 'number' || typeof data.id === 'string' ? String(data.id) : ''
  return request.post<MaterialBatchOutboundResult>({
    url: '/scrap/material/outbound',
    params: {
      id,
      receiver_id: data.receiver_id
    },
    showSuccessMessage: options?.showSuccessMessage ?? true
  })
}

/** 批量领料出库 */
export async function fetchMaterialBatchOutbound(entryIds: number[], receiverId: number) {
  return fetchMaterialOutbound(
    {
      id: entryIds.join(','),
      receiver_id: receiverId
    },
    { showSuccessMessage: false }
  )
}

/** 整单退库 */
export async function fetchMaterialReturn(data: MaterialReturnParams) {
  return request.post({
    url: '/scrap/material/return',
    params: data,
    showSuccessMessage: true
  })
}

/** 导出领料记录 */
export async function fetchMaterialExport(params: MaterialSearchParams) {
  const res = await request.get<{ list: Record<string, string>[]; title?: string }>({
    url: '/scrap/material/export',
    params: {
      keyword: params.keyword?.trim() || '',
      status: params.status !== undefined && params.status !== '' ? params.status : ''
    }
  })
  return res.list || []
}
