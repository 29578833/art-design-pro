// ==================== 销售出库 ====================

/** 出库类型 */
export type SaleOutboundType = 'sale' | 'transfer' | 'scrap'

/** 出库状态 */
export type SaleOutboundStatus = 'pending_approval' | 'approved' | 'completed' | 'rejected'

/** 销售出库单列表项 */
export interface SaleOutboundItem {
  id: number
  exit_no?: string
  exit_type?: SaleOutboundType
  exit_type_text?: string
  customer_name?: string
  contact_phone?: string
  items_desc?: string
  total_amount?: number | string
  remark?: string
  status: SaleOutboundStatus
  status_text?: string
  apply_time?: string
  applicant?: string
  applicant_id?: number
  approver?: string
  approver_id?: number
  approve_time?: string
  complete_time?: string
  [key: string]: unknown
}

/** 列表查询参数 */
export interface SaleOutboundSearchParams {
  keyword?: string
  status?: SaleOutboundStatus | ''
  exit_type?: SaleOutboundType | ''
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 统计数据 */
export interface SaleOutboundStats {
  varieties: number
  reusable_parts: number
  metal_weight: number
  total_value: string
  pending_outbound: number
}

/** 新建出库单参数 */
export interface SaleOutboundCreateParams {
  exit_type: SaleOutboundType
  customer_name: string
  contact_phone?: string
  items_desc: string
  total_amount: number
  remark?: string
}

/** 出库类型配置 */
export const SALE_OUTBOUND_TYPE_CONFIG: Record<
  SaleOutboundType,
  { label: string; color: string; bg: string }
> = {
  sale: { label: '销售出库', color: '#1677ff', bg: '#E6F7FF' },
  transfer: { label: '库位调拨', color: '#722ED1', bg: '#F9F0FF' },
  scrap: { label: '报废处理', color: '#FF4D4F', bg: '#FFF1F0' }
}

/** 出库状态配置 */
export const SALE_OUTBOUND_STATUS_CONFIG: Record<
  SaleOutboundStatus,
  { label: string; color: string; bg: string }
> = {
  pending_approval: { label: '待审批', color: '#FA8C16', bg: '#FFF7E6' },
  approved: { label: '审批通过', color: '#1677ff', bg: '#E6F7FF' },
  completed: { label: '已完成', color: '#52C41A', bg: '#F6FFED' },
  rejected: { label: '已驳回', color: '#FF4D4F', bg: '#FFF1F0' }
}

/** 出库类型筛选 */
export const SALE_OUTBOUND_TYPE_FILTERS: {
  label: string
  value: SaleOutboundType | ''
}[] = [
  { label: '全部类型', value: '' },
  { label: '销售出库', value: 'sale' },
  { label: '库位调拨', value: 'transfer' },
  { label: '报废处理', value: 'scrap' }
]

/** 出库状态筛选 */
export const SALE_OUTBOUND_STATUS_FILTERS: {
  label: string
  value: SaleOutboundStatus | ''
}[] = [
  { label: '全部状态', value: '' },
  { label: '待审批', value: 'pending_approval' },
  { label: '审批通过', value: 'approved' },
  { label: '已完成', value: 'completed' },
  { label: '已驳回', value: 'rejected' }
]
