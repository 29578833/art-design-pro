// ==================== 付款流水 ====================

/** 流水状态：与结算状态一致 1~5 */
export type PaymentLogStatus = 1 | 2 | 3 | 4 | 5

/** 付款流水列表项 */
export interface PaymentLogItem {
  id: number
  settlement_id?: number
  payment_no?: string
  settlement_no?: string
  order_id?: number
  order_no?: string
  plate_no?: string
  owner_name?: string
  pay_amount?: number
  pay_method?: string
  pay_method_text?: string
  pay_time?: string
  pay_user_id?: number
  pay_user_name?: string
  proof_image?: string
  status: PaymentLogStatus
  status_text?: string
  remark?: string
  add_time?: number | string
  update_time?: number | string
  [key: string]: unknown
}

/** 列表查询 */
export interface PaymentLogSearchParams {
  keyword?: string
  status?: PaymentLogStatus | ''
  start_time?: string
  end_time?: string
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 统计（结构与结算 stats 一致） */
export interface PaymentLogStats {
  pending_audit: number
  pending_approve: number
  pending_pay: number
  monthly_settled: number
  monthly_total: number
}

/** 状态配置 */
export const PAYMENT_LOG_STATUS_CONFIG: Record<
  PaymentLogStatus,
  { label: string; color: string; bg: string }
> = {
  1: { label: '待财务审核', color: '#FA8C16', bg: '#FFF7E6' },
  2: { label: '待管理员审批', color: '#722ED1', bg: '#F9F0FF' },
  3: { label: '待付款', color: '#1677ff', bg: '#E6F7FF' },
  4: { label: '已付款', color: '#52C41A', bg: '#F6FFED' },
  5: { label: '已驳回', color: '#FF4D4F', bg: '#FFF1F0' }
}

/** 状态筛选 */
export const PAYMENT_LOG_STATUS_FILTERS: {
  label: string
  value: PaymentLogStatus | ''
}[] = [
  { label: '全部状态', value: '' },
  { label: '待财务审核', value: 1 },
  { label: '待管理员审批', value: 2 },
  { label: '待付款', value: 3 },
  { label: '已付款', value: 4 },
  { label: '已驳回', value: 5 }
]
