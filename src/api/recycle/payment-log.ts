import request from '@/utils/http'
import type {
  PaymentLogItem,
  PaymentLogSearchParams,
  PaymentLogStats
} from '@/types/recycle/payment-log'

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

function buildListParams(params: PaymentLogSearchParams) {
  const { page, limit } = resolvePagination(params)
  return {
    page,
    limit,
    keyword: params.keyword?.trim() || '',
    status: params.status !== undefined && params.status !== '' ? params.status : '',
    start_time: params.start_time || '',
    end_time: params.end_time || ''
  }
}

/** 付款流水列表 */
export async function fetchPaymentLogList(params: PaymentLogSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<{ list: PaymentLogItem[]; count: number }>({
    url: '/scrap/payment_log/list',
    params: query
  })
  return {
    records: res.list || [],
    total: res.count || 0,
    current: query.page,
    size: query.limit
  }
}

/** 付款流水统计 */
export async function fetchPaymentLogStats(): Promise<PaymentLogStats> {
  const res = await request.get<PaymentLogStats>({
    url: '/scrap/payment_log/stats'
  })
  return {
    pending_audit: res.pending_audit || 0,
    pending_approve: res.pending_approve || 0,
    pending_pay: res.pending_pay || 0,
    monthly_settled: res.monthly_settled || 0,
    monthly_total: res.monthly_total || 0
  }
}

/** 导出付款流水 */
export async function fetchPaymentLogExport(params: PaymentLogSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<
    { list?: Record<string, string>[]; count?: number } | Record<string, string>[]
  >({
    url: '/scrap/payment_log/export',
    params: {
      keyword: query.keyword,
      status: query.status,
      start_time: query.start_time,
      end_time: query.end_time
    }
  })
  if (Array.isArray(res)) return res
  return res.list || []
}
