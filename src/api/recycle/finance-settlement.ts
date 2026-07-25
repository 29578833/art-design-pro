import request from '@/utils/http'
import type {
  SettlementBillDetail,
  SettlementBillItem,
  SettlementBillSearchParams,
  SettlementBillStats
} from '@/types/recycle/finance/settlement/finance-settlement'
import type {
  SettlementBillCreatePayload,
  SettlementVehicleCandidateList
} from '@/types/recycle/finance/settlement/finance-settlement-candidate'
import type {
  SettlementExportBusiness,
  SettlementVehicleExportResult,
  SettlementVehicleExportRow,
  SettlementVehicleExportSearchParams
} from '@/types/recycle/finance/export/finance-settlement-export'

function resolvePagination(params: {
  page?: number
  limit?: number
  current?: number
  size?: number
}) {
  return {
    page: Number(params.page ?? params.current ?? 1),
    limit: Number(params.limit ?? params.size ?? 15)
  }
}

/** 结算单列表 */
export async function fetchSettlementBillList(params: SettlementBillSearchParams) {
  const { page, limit } = resolvePagination(params)
  const query = { ...params }
  delete query.current
  delete query.size
  const res = await request.get<{ list: SettlementBillItem[]; count: number }>({
    url: '/scrap/settlement/list',
    params: { ...query, page, limit }
  })
  return {
    records: res.list || [],
    total: Number(res.count || 0),
    current: page,
    size: limit
  }
}

/** 结算统计 */
export function fetchSettlementBillStats() {
  return request.get<SettlementBillStats>({
    url: '/scrap/settlement/stats'
  })
}

/** 结算单详情 */
export function fetchSettlementBillDetail(id: number, params?: { tab?: string; keyword?: string }) {
  return request.get<SettlementBillDetail>({
    url: `/scrap/settlement/detail/${id}`,
    params
  })
}

/** 可结算车辆列表 */
export function fetchSettlementVehicleCandidates(params: {
  keyword?: string
  page?: number
  limit?: number
}) {
  return request.get<SettlementVehicleCandidateList>({
    url: '/scrap/settlement/vehicle_list',
    params
  })
}

/** 批量创建结算单 */
export function fetchSettlementBillCreate(payload: SettlementBillCreatePayload) {
  const url =
    payload.settlement_type === 'service_fee'
      ? '/scrap/settlement/create_service_fee'
      : '/scrap/settlement/create_residual'
  return request.post({
    url,
    params: {
      vehicles: payload.vehicles,
      contract_no: payload.contract_no || '',
      remark: payload.remark || ''
    },
    showSuccessMessage: true
  })
}

/** 审核结算单 */
export function fetchSettlementBillApprove(id: number, pass: boolean, remark: string) {
  return request.post({
    url: `/scrap/settlement/audit/${id}`,
    params: { type: pass ? 'pass' : 'reject', remark },
    showSuccessMessage: true
  })
}

/** 确认付款 */
export function fetchSettlementBillPay(id: number, proof_image: string) {
  return request.post({
    url: `/scrap/settlement/pay/${id}`,
    params: { proof_image },
    showSuccessMessage: true
  })
}

/** 导出结算单数据 */
export function fetchSettlementBillExport(params: SettlementBillSearchParams) {
  return request.get<Record<string, string | number>[]>({
    url: '/scrap/settlement/export',
    params
  })
}

/** 结算车辆导出列表 */
export async function fetchSettlementVehicleExportList(
  params: SettlementVehicleExportSearchParams
) {
  const { page, limit } = resolvePagination(params)
  const query = { ...params }
  delete query.current
  delete query.size
  const res = await request.get<{
    list: SettlementVehicleExportRow[]
    count: number
    pendingCount?: number
    settledCount?: number
  }>({
    url: '/scrap/settlement_vehicle_export/list',
    params: { ...query, page, limit }
  })
  return {
    records: res.list || [],
    total: Number(res.count || 0),
    pendingCount: Number(res.pendingCount || 0),
    settledCount: Number(res.settledCount || 0),
    current: page,
    size: limit
  }
}

/** 结算车辆导出业务员列表 */
export function fetchSettlementExportBusinessList() {
  return request.get<SettlementExportBusiness[]>({
    url: '/scrap/settlement_vehicle_export/business_list'
  })
}

/** 按字段导出结算车辆 */
export function fetchSettlementVehicleExport(
  params: SettlementVehicleExportSearchParams & { fields: string }
) {
  return request.get<SettlementVehicleExportResult>({
    url: '/scrap/settlement_vehicle_export/export',
    params
  })
}
