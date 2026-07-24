/** 结算单类型（后端原值） */
export type SettlementBillType = 'residual' | 'service_fee'

/** 结算状态：1待财务审核 2待管理员审批 3待付款 4已付款 5已驳回 */
export type SettlementBillStatus = 1 | 2 | 3 | 4 | 5

/** 列表页签 */
export type SettlementBillNavTab = 'all' | 'pending_audit' | 'approved' | 'rejected' | 'pending_pay'

/** 结算单列表项（接口原字段） */
export interface SettlementBillItem {
  /** 主键 */
  id: number
  /** 结算单号 */
  settlement_no: string
  /** 合同编号 */
  contract_no: string
  /** 关联订单号 */
  order_no?: string
  /** 结算类型 */
  settlement_type: SettlementBillType
  /** 结算类型文案 */
  settlement_type_text: string
  /** 收费类型 */
  charge_type: string
  /** 收费类型文案 */
  charge_type_text: string
  /** 结算状态 */
  settlement_status: SettlementBillStatus
  /** 结算状态文案 */
  settlement_status_text: string
  /** 申请人 */
  applicant: string
  /** 申请时间 */
  apply_time: string
  /** 申请人原字段 */
  settlement_user_name?: string
  /** 审核人 */
  audit_user_name?: string
  /** 审核时间 */
  audit_time?: string
  /** 审核备注 */
  audit_remark?: string
  /** 审批人 */
  approve_user_name?: string
  /** 审批时间 */
  approve_time?: string
  /** 审批备注 */
  approve_remark?: string
  /** 最终结算金额 */
  final_price: number
  /** 付款凭证 */
  proof_image?: string
  /** 付款凭证存储字段 */
  settlement_proof?: string
  /** 付款时间 */
  pay_time?: string
  /** 备注 */
  remark?: string
  [key: string]: unknown
}

/** 结算车辆详情（接口原字段） */
export interface SettlementBillVehicle {
  /** 主键 */
  id: number
  /** 车辆 ID */
  vehicle_id: number
  /** 关联订单 ID */
  order_id?: number
  /** 车牌号 */
  plate_no: string
  /** 自编号 */
  vehicle_no: string
  /** 车型 */
  model: string
  /** 车辆类型 */
  vehicle_type: string
  /** 入库单号 */
  warehouse_no: string
  /** 入库时间 */
  entry_time: string
  /** 入库日期 */
  entry_date: string
  /** 结算方式 */
  settlement_method: string
  /** 结算方式文案 */
  settlement_method_text: string
  /** 整备质量（kg） */
  prepared_weight: number
  /** 整备质量（吨） */
  prepared_weight_ton: number | string
  /** 实际重量（kg） */
  actual_weight: number
  /** 实际重量（吨） */
  actual_weight_ton: number | string
  /** 缺补件吨位 */
  missing_compensation_pos_ton: number | string
  /** 自送补贴 */
  self_delivery_subsidy: number
  /** 残值单价 */
  residual_unit_price: number
  /** 缺件金额 */
  missing_parts: number
  /** 缺件扣款 */
  missing_deduction: number
  /** 扣款 */
  deduction: number
  /** 残值金额 */
  residual_amount: number
  /** 实付残值 */
  actual_pay_amount: number
  /** 服务费单价 */
  service_fee_unit_price: number
  /** 服务费合计 */
  service_fee_total: number
  /** 单车总额 */
  total_amount: number
  /** 单车总额别名 */
  single_total: number
  /** 修改说明 */
  modify_remark: string
  /** 审核状态 */
  audit_status: 'pending' | 'pass' | 'reject'
  /** 审核状态文案 */
  audit_status_text: string
  /** 审核人 */
  audit_user_name: string
  /** 审核时间 */
  audit_time: string
  /** 驳回原因 */
  reject_reason: string
  /** 申请备注 */
  apply_remark: string
  /** 备注 */
  remark: string
  [key: string]: unknown
}

/** 结算详情响应 */
export interface SettlementBillDetail {
  settlement: SettlementBillItem
  list: SettlementBillVehicle[]
  count: number
}

/** 结算列表查询（后端 getMore 原字段） */
export interface SettlementBillSearchParams {
  settlement_status?: SettlementBillStatus | ''
  settlement_type?: SettlementBillType | ''
  charge_type?: string
  settlement_no?: string
  contract_no?: string
  keyword?: string
  applicant?: string
  start_time?: string
  end_time?: string
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 结算统计 */
export interface SettlementBillStats {
  all: number
  pending_audit: number
  approved: number
  rejected: number
  pending_pay: number
  monthly_settled: number
  monthly_total: number
}

export const SETTLEMENT_BILL_TYPE_CONFIG: Record<
  SettlementBillType,
  { label: string; color: string; bg: string }
> = {
  service_fee: { label: '服务费结算单', color: '#4169FF', bg: '#E6F0FF' },
  residual: { label: '残值结算单', color: '#722ED1', bg: '#F9F0FF' }
}

export const SETTLEMENT_BILL_STATUS_CONFIG: Record<
  SettlementBillStatus,
  { label: string; color: string; bg: string }
> = {
  1: { label: '待财务审核', color: '#FA8C16', bg: '#FFF7E6' },
  2: { label: '待管理员审批', color: '#722ED1', bg: '#F9F0FF' },
  3: { label: '待付款', color: '#4169FF', bg: '#E6F0FF' },
  4: { label: '已付款', color: '#52C41A', bg: '#F6FFED' },
  5: { label: '已驳回', color: '#FF4D4F', bg: '#FFF1F0' }
}

export const SETTLEMENT_BILL_NAV_TABS: { key: SettlementBillNavTab; label: string }[] = [
  { key: 'all', label: '全部结算单' },
  { key: 'pending_audit', label: '待审核' },
  { key: 'approved', label: '审核通过' },
  { key: 'rejected', label: '审核不通过' },
  { key: 'pending_pay', label: '待付款' }
]
