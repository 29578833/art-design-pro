import request from '@/utils/http'
import type {
  SaleOutboundCreateParams,
  SaleOutboundItem,
  SaleOutboundSearchParams,
  SaleOutboundStats
} from '@/types/recycle/sale-outbound'

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

function buildListParams(params: SaleOutboundSearchParams) {
  const { page, limit } = resolvePagination(params)
  return {
    page,
    limit,
    keyword: params.keyword?.trim() || '',
    status: params.status || '',
    exit_type: params.exit_type || ''
  }
}

/** 销售出库列表 */
export async function fetchSaleOutboundList(params: SaleOutboundSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<{ list: SaleOutboundItem[]; count: number }>({
    url: '/scrap/sale_outbound/list',
    params: query
  })
  return {
    records: res.list || [],
    total: res.count || 0,
    current: query.page,
    size: query.limit
  }
}

/** 销售出库统计 */
export async function fetchSaleOutboundStats(): Promise<SaleOutboundStats> {
  const res = await request.get<SaleOutboundStats>({
    url: '/scrap/sale_outbound/stats'
  })
  return {
    varieties: res.varieties || 0,
    reusable_parts: res.reusable_parts || 0,
    metal_weight: res.metal_weight || 0,
    total_value: res.total_value || '¥0',
    pending_outbound: res.pending_outbound || 0
  }
}

/** 新建销售出库单 */
export function fetchSaleOutboundCreate(data: SaleOutboundCreateParams) {
  return request.post({
    url: '/scrap/sale_outbound/create',
    params: data,
    showSuccessMessage: true
  })
}

/** 审批通过 */
export function fetchSaleOutboundApprove(id: number) {
  return request.post({
    url: `/scrap/sale_outbound/approve/${id}`,
    showSuccessMessage: true
  })
}

/** 确认出库完成 */
export function fetchSaleOutboundComplete(id: number) {
  return request.post({
    url: `/scrap/sale_outbound/complete/${id}`,
    showSuccessMessage: true
  })
}

/** 导出销售出库 */
export async function fetchSaleOutboundExport(params: SaleOutboundSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<{ list: Record<string, string>[]; count?: number }>({
    url: '/scrap/sale_outbound/export',
    params: {
      keyword: query.keyword,
      status: query.status,
      exit_type: query.exit_type
    }
  })
  return res.list || []
}
