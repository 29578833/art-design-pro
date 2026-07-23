// ==================== 财务结算单（PRD v4.2） ====================

/** 结算单类型 */
export type SettlementBillType = '服务费结算单' | '残值结算单'

/** 结算单状态 */
export type SettlementBillStatus = '待审核' | '审核通过' | '审核不通过' | '待付款' | '已付款'

/** 列表 Tab */
export type SettlementBillNavTab = 'all' | '待审核' | '审核通过' | '审核不通过' | '待付款'

/** 付款方式 */
export type SettlementPayMethod = 'wechat' | 'bank_private' | 'bank_public'

/** 明细行审核状态 */
export type SettlementLineReviewStatus = '待审核' | '审核通过' | '审核不通过'

/** 结算单明细行 */
export interface SettlementBillLineItem {
  seq: number
  entry_date: string
  self_no: string
  plate: string
  inbound_no?: string
  vehicle_model: string
  vehicle_type: string
  settle_type: string
  std_weight: number
  actual_weight: number
  self_delivery_subsidy: number
  missing_part_tonnage: number
  residual_unit_price: number
  missing_part_amt: number
  hub_material: string
  deduction: number
  missing_part_exempt: string
  expected_residual: number
  service_fee_per_ton?: number
  service_fee_total?: number
  total_per_vehicle: number
  modify_note: string
  qc_missing_note: string
  review_status?: SettlementLineReviewStatus
  reject_reason?: string
  reviewer?: string
  review_time?: string
  apply_remark?: string
}

/** 结算单主表 */
export interface SettlementBillItem {
  id: string
  contract_no: string
  order_no: string
  charge_type: string
  settlement_type: SettlementBillType
  applicant: string
  apply_time: string
  status: SettlementBillStatus
  reviewer_settle: string
  review_time_settle: string
  reviewer_finance: string
  review_time_finance: string
  finance_remark: string
  amount: number
  payment_voucher?: string
  payment_time?: string
  payment_method?: SettlementPayMethod
  items: SettlementBillLineItem[]
}

/** 列表查询 */
export interface SettlementBillSearchParams {
  nav_tab?: SettlementBillNavTab
  status_quick?: SettlementBillNavTab
  salesman?: string
  order_keyword?: string
  applicant?: string
  apply_start?: string
  apply_end?: string
  settlement_type?: SettlementBillType | ''
  page?: number
  limit?: number
  current?: number
  size?: number
}

export const SETTLEMENT_BILL_TYPE_CONFIG: Record<
  SettlementBillType,
  { label: string; color: string; bg: string }
> = {
  服务费结算单: { label: '服务费结算单', color: '#4169FF', bg: '#E6F0FF' },
  残值结算单: { label: '残值结算单', color: '#722ED1', bg: '#F9F0FF' }
}

export const SETTLEMENT_BILL_STATUS_CONFIG: Record<
  SettlementBillStatus,
  { label: string; color: string; bg: string }
> = {
  待审核: { label: '待审核', color: '#FA8C16', bg: '#FFF7E6' },
  审核通过: { label: '审核通过', color: '#52C41A', bg: '#F6FFED' },
  审核不通过: { label: '审核不通过', color: '#FF4D4F', bg: '#FFF1F0' },
  待付款: { label: '待付款', color: '#4169FF', bg: '#E6F0FF' },
  已付款: { label: '已付款', color: '#2F54EB', bg: '#F0F5FF' }
}

export const SETTLEMENT_BILL_NAV_TABS: { key: SettlementBillNavTab; label: string }[] = [
  { key: 'all', label: '全部结算单' },
  { key: '待审核', label: '待审核' },
  { key: '审核通过', label: '审核通过' },
  { key: '审核不通过', label: '审核不通过' },
  { key: '待付款', label: '待付款' }
]

export const SETTLEMENT_PAY_METHOD_OPTIONS: { label: string; value: SettlementPayMethod }[] = [
  { label: '微信支付', value: 'wechat' },
  { label: '银行转账（对私）', value: 'bank_private' },
  { label: '银行转账（对公）', value: 'bank_public' }
]
