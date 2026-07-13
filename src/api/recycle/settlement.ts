import request from '@/utils/http'
import type {
  SettlementBankAccount,
  SettlementBusinessStatItem,
  SettlementCalculateResult,
  SettlementCreateParams,
  SettlementItem,
  SettlementSearchParams,
  SettlementStats
} from '@/types/recycle/settlement'

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

function buildListParams(params: SettlementSearchParams) {
  const { page, limit } = resolvePagination(params)
  return {
    page,
    limit,
    keyword: params.keyword?.trim() || '',
    settlement_no: params.settlement_no?.trim() || '',
    settlement_status:
      params.settlement_status !== undefined && params.settlement_status !== ''
        ? params.settlement_status
        : '',
    start_time: params.start_time || '',
    end_time: params.end_time || ''
  }
}

/** 结算列表 */
export async function fetchSettlementList(params: SettlementSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<{ list: SettlementItem[]; count: number }>({
    url: '/scrap/settlement/list',
    params: query
  })
  return {
    records: res.list || [],
    total: res.count || 0,
    current: query.page,
    size: query.limit
  }
}

/** 结算统计 */
export async function fetchSettlementStats(): Promise<SettlementStats> {
  const res = await request.get<SettlementStats>({
    url: '/scrap/settlement/stats'
  })
  return {
    pending_audit: res.pending_audit || 0,
    pending_approve: res.pending_approve || 0,
    pending_pay: res.pending_pay || 0,
    monthly_settled: res.monthly_settled || 0,
    monthly_total: res.monthly_total || 0
  }
}

/** 预览结算金额 */
export function fetchSettlementCalculate(orderId: number) {
  return request.get<SettlementCalculateResult>({
    url: `/scrap/settlement/calculate/${orderId}`
  })
}

/** 创建结算单 */
export function fetchSettlementCreate(data: SettlementCreateParams) {
  return request.post({
    url: '/scrap/settlement/create',
    params: data,
    showSuccessMessage: true
  })
}

/** 财务审核通过 */
export function fetchSettlementAudit(id: number, remark = '') {
  return request.post({
    url: `/scrap/settlement/audit/${id}`,
    params: { remark },
    showSuccessMessage: true
  })
}

/** 管理员审批通过 */
export function fetchSettlementApprove(id: number, remark = '') {
  return request.post({
    url: `/scrap/settlement/approve/${id}`,
    params: { remark },
    showSuccessMessage: true
  })
}

/** 驳回结算 */
export function fetchSettlementReject(id: number, remark: string) {
  return request.post({
    url: `/scrap/settlement/reject/${id}`,
    params: { remark },
    showSuccessMessage: true
  })
}

/** 确认付款 */
export function fetchSettlementPay(id: number, proof_image = '') {
  return request.post({
    url: `/scrap/settlement/pay/${id}`,
    params: { proof_image },
    showSuccessMessage: true
  })
}

/** 导出结算 */
export async function fetchSettlementExport(params: SettlementSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<
    { list?: Record<string, string>[]; count?: number } | Record<string, string>[]
  >({
    url: '/scrap/settlement/export',
    params: {
      keyword: query.keyword,
      settlement_status: query.settlement_status,
      start_time: query.start_time,
      end_time: query.end_time
    }
  })
  if (Array.isArray(res)) return res
  return res.list || []
}

/** 业务员结算统计 */
export async function fetchSettlementBusinessStats() {
  const res = await request.get<
    SettlementBusinessStatItem[] | { list: SettlementBusinessStatItem[] }
  >({
    url: '/scrap/settlement/business_stats'
  })
  if (Array.isArray(res)) return res
  return res.list || []
}

/** 导出业务员统计 */
export async function fetchSettlementBusinessStatsExport() {
  const res = await request.get<
    { list?: Record<string, string>[]; count?: number } | Record<string, string>[]
  >({
    url: '/scrap/settlement/business_stats_export'
  })
  if (Array.isArray(res)) return res
  return res.list || []
}

/** 用户银行账户列表 */
export async function fetchUserBankList(uid: number) {
  const res = await request.get<SettlementBankAccount[] | { list: SettlementBankAccount[] }>({
    url: `/scrap/user/bank_list/${uid}`
  })
  if (Array.isArray(res)) return res
  return res.list || []
}
