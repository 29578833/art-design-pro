// ==================== 结算管理 ====================

/** 结算状态：1待财务审核 2待管理员审批 3待付款 4已付款 5已驳回 */
export type SettlementStatus = 1 | 2 | 3 | 4 | 5

/** 结算方式 */
export type SettlementMethod = 'bank_transfer' | 'wechat' | 'alipay' | 'cash'

/** 结算列表项 */
export interface SettlementItem {
  id: number
  order_id?: number
  vehicle_id?: number
  settlement_no?: string
  vehicle_price?: number
  parts_price?: number
  output_price?: number
  deduction_price?: number
  subsidy_price?: number
  final_price?: number
  base_price?: number
  settlement_method?: SettlementMethod | string
  bank_account_id?: number
  bank_account_name?: string
  bank_name?: string
  bank_account_no?: string
  settlement_status: SettlementStatus
  settlement_status_text?: string
  settlement_user_id?: number
  settlement_user_name?: string
  audit_user_id?: number
  audit_user_name?: string
  audit_time?: string
  audit_remark?: string
  approve_user_id?: number
  approve_user_name?: string
  approve_time?: string
  approve_remark?: string
  pay_time?: string
  settlement_time?: string
  settlement_proof?: string
  remark?: string
  order_no?: string
  owner_name?: string
  owner_type?: string
  owner_type_text?: string
  business_id?: number
  business_name?: string
  self_delivery_subsidy?: number
  plate_no?: string
  add_time?: number | string
  update_time?: number | string
  [key: string]: unknown
}

/** 列表查询 */
export interface SettlementSearchParams {
  keyword?: string
  settlement_status?: SettlementStatus | ''
  settlement_no?: string
  start_time?: string
  end_time?: string
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 统计 */
export interface SettlementStats {
  pending_audit: number
  pending_approve: number
  pending_pay: number
  monthly_settled: number
  monthly_total: number
}

/** 金额预览 */
export interface SettlementCalculateResult {
  vehicle_price?: number
  deduction_price?: number
  output_price?: number
  subsidy_price?: number
  final_price?: number
  [key: string]: unknown
}

/** 创建参数 */
export interface SettlementCreateParams {
  order_id: number
  settlement_no?: string
  settlement_method: SettlementMethod | string
  bank_account_id: number
  remark?: string
}

/** 业务员统计 */
export interface SettlementBusinessStatItem {
  business_id?: number
  business_name?: string
  monthly_target?: number
  vehicle_count?: number
  total_amount?: number
  avg_price?: number
  completion_rate?: number
  rank?: number
  [key: string]: unknown
}

/** 银行账户 */
export interface SettlementBankAccount {
  id: number
  account_name?: string
  bank_name?: string
  bank_account?: string
  account_no?: string
  [key: string]: unknown
}

/** 状态配置 */
export const SETTLEMENT_STATUS_CONFIG: Record<
  SettlementStatus,
  { label: string; color: string; bg: string; step: number }
> = {
  1: { label: '待财务审核', color: '#FA8C16', bg: '#FFF7E6', step: 1 },
  2: { label: '待管理员审批', color: '#722ED1', bg: '#F9F0FF', step: 2 },
  3: { label: '待付款', color: '#1677ff', bg: '#E6F7FF', step: 3 },
  4: { label: '已付款', color: '#52C41A', bg: '#F6FFED', step: 4 },
  5: { label: '已驳回', color: '#FF4D4F', bg: '#FFF1F0', step: -1 }
}

/** 流程步骤文案 */
export const SETTLEMENT_STEPS = ['结算申请', '财务审核', '管理员审批', '付款完结']

/** 状态筛选 */
export const SETTLEMENT_STATUS_FILTERS: {
  label: string
  value: SettlementStatus | ''
}[] = [
  { label: '全部状态', value: '' },
  { label: '待财务审核', value: 1 },
  { label: '待管理员审批', value: 2 },
  { label: '待付款', value: 3 },
  { label: '已付款', value: 4 },
  { label: '已驳回', value: 5 }
]

/** 结算方式选项 */
export const SETTLEMENT_METHOD_OPTIONS: { label: string; value: SettlementMethod }[] = [
  { label: '银行转账', value: 'bank_transfer' },
  { label: '微信支付', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '现金', value: 'cash' }
]
