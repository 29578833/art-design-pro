import { SEED_SETTLEMENT_BILLS } from '@/mock/recycle/finance-settlement.mock'
import { SETTLEMENT_VEHICLE_CANDIDATES } from '@/mock/recycle/finance-settlement-candidates'
import type {
  SettlementBillItem,
  SettlementBillNavTab,
  SettlementBillSearchParams,
  SettlementBillStatus,
  SettlementPayMethod
} from '@/types/recycle/finance-settlement'
import type { SettlementBillCreatePayload } from '@/types/recycle/finance-settlement-candidate'

function delay(ms = 180) {
  return new Promise((r) => setTimeout(r, ms))
}

function cloneBills() {
  return structuredClone(SEED_SETTLEMENT_BILLS) as SettlementBillItem[]
}

let billStore: SettlementBillItem[] = cloneBills()

function resolvePage(params: { page?: number; limit?: number; current?: number; size?: number }) {
  const page = Number(params.page ?? params.current ?? 1)
  const limit = Number(params.limit ?? params.size ?? 20)
  return { page: Math.max(1, page), limit: Math.max(1, limit) }
}

function tabStatusMatch(tab: SettlementBillNavTab, status: SettlementBillStatus): boolean {
  if (tab === 'all') return true
  if (tab === '待审核') return status === '待审核'
  if (tab === '审核通过') return status === '审核通过' || status === '已付款'
  if (tab === '审核不通过') return status === '审核不通过'
  if (tab === '待付款') return status === '待付款'
  return true
}

function filterBills(params: SettlementBillSearchParams) {
  const navTab = params.nav_tab ?? 'all'
  const statusQuick = params.status_quick ?? 'all'

  return billStore.filter((r) => {
    const tabOk = tabStatusMatch(navTab, r.status)
    const quickOk =
      navTab !== 'all' || statusQuick === 'all' || tabStatusMatch(statusQuick, r.status)
    const typeOk = !params.settlement_type || r.settlement_type === params.settlement_type
    const salesOk = !params.salesman?.trim() || r.applicant.includes(params.salesman.trim())
    const orderKw = params.order_keyword?.trim() || ''
    const orderOk = !orderKw || r.contract_no.includes(orderKw) || r.order_no.includes(orderKw)
    const appOk = !params.applicant?.trim() || r.applicant.includes(params.applicant.trim())
    const start = params.apply_start || ''
    const end = params.apply_end || ''
    const dateOk =
      (!start || r.apply_time.slice(0, 10) >= start) && (!end || r.apply_time.slice(0, 10) <= end)
    return tabOk && quickOk && typeOk && salesOk && orderOk && appOk && dateOk
  })
}

export async function fetchSettlementBillList(params: SettlementBillSearchParams) {
  await delay()
  const { page, limit } = resolvePage(params)
  const filtered = filterBills(params)
  const start = (page - 1) * limit
  const records = filtered.slice(start, start + limit).map((row) => ({
    ...row,
    items: undefined
  })) as SettlementBillItem[]
  return {
    records,
    total: filtered.length,
    current: page,
    size: limit
  }
}

export async function fetchSettlementBillTabCounts() {
  await delay(80)
  const tabs: SettlementBillNavTab[] = ['all', '待审核', '审核通过', '审核不通过', '待付款']
  const counts: Record<SettlementBillNavTab, number> = {} as Record<SettlementBillNavTab, number>
  for (const tab of tabs) {
    counts[tab] = billStore.filter((r) => tabStatusMatch(tab, r.status)).length
  }
  return counts
}

export async function fetchSettlementBillDetail(id: string) {
  await delay()
  const row = billStore.find((r) => r.id === id)
  if (!row) throw new Error('结算单不存在')
  return structuredClone(row)
}

export async function fetchSettlementBillApprove(id: string, pass: boolean, remark: string) {
  await delay()
  const now = new Date().toLocaleString('zh-CN').replace(/\//g, '-')
  billStore = billStore.map((r) =>
    r.id === id
      ? {
          ...r,
          status: pass ? '待付款' : '审核不通过',
          reviewer_settle: '当前用户',
          review_time_settle: now,
          finance_remark: remark || r.finance_remark
        }
      : r
  )
}

export async function fetchSettlementBillPay(
  id: string,
  voucherName: string,
  method?: SettlementPayMethod
) {
  await delay()
  const now = new Date().toLocaleString('zh-CN').replace(/\//g, '-')
  billStore = billStore.map((r) =>
    r.id === id
      ? {
          ...r,
          status: '已付款',
          payment_voucher: voucherName,
          payment_time: now,
          payment_method: method || 'bank_private'
        }
      : r
  )
}

export async function fetchSettlementBillCreate(payload: SettlementBillCreatePayload) {
  await delay()
  const nextId = String(Math.max(0, ...billStore.map((r) => Number(r.id) || 0)) + 1)
  const row: SettlementBillItem = {
    id: nextId,
    contract_no: payload.contract_no,
    order_no: payload.order_no,
    charge_type: payload.charge_type,
    settlement_type: payload.settlement_type,
    applicant: payload.applicant,
    apply_time: payload.apply_time,
    status: '待审核',
    reviewer_settle: '',
    review_time_settle: '',
    reviewer_finance: '',
    review_time_finance: '',
    finance_remark: '',
    amount: payload.amount,
    items: structuredClone(payload.items)
  }
  billStore = [row, ...billStore]
  return row
}

export async function fetchSettlementBillExport(params: SettlementBillSearchParams) {
  await delay()
  return filterBills(params).map((row) => ({
    合同编号: row.contract_no,
    关联订单号: row.order_no,
    收费类型: row.charge_type,
    结算单类型: row.settlement_type,
    申请人: row.applicant,
    申请时间: row.apply_time,
    状态: row.status,
    结算金额: row.amount
  }))
}

/** 测试重置 */
export function resetSettlementBillMockStore() {
  billStore = cloneBills()
}

export async function fetchSettlementVehicleCandidates() {
  await delay(80)
  return structuredClone(SETTLEMENT_VEHICLE_CANDIDATES)
}
