/** 列表 Tab */
export type OrderTab = 'all' | 'lead' | 'formal_order' | 'towing' | 'pending_review'

/** 正式回收订单筛选 */
export type FormalOrderSource = 'all' | 'customer' | 'staff'
export type FormalOrderStatusFilter =
  | 'all'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'completed'
export type SignFilter = 'all' | 'pending_sign' | 'signed'
export type BatchTypeFilter = 'all' | 'single' | 'batch'

/** 线索订单筛选 */
export type LeadFollowFilter = 'all' | 'pending' | 'assigned' | 'viewed'
export type LeadTypeFilter = 'all' | 'vehicle' | 'customer'

/** 拖车订单筛选 */
export type TowingStatusFilter =
  | 'all'
  | 'pending_dispatch'
  | 'pending_towing'
  | 'towing'
  | 'completed'

/** 全部订单进度筛选 */
export type ProgressFilter = 'all' | 'ongoing' | 'finished'

/** 订单列表项（直接使用接口字段，不做映射） */
export interface RecycleOrder {
  /** 主键 ID */
  id: number
  /** 订单编号 */
  order_no?: string
  /** 拖车单编号 */
  tow_no?: string
  /** 订单类型：vehicle_lead / customer_lead / customer_order / staff_order / tow */
  order_type: string
  /** 订单类型文案 */
  order_type_text?: string
  /** 状态码 */
  status: number
  /** 当前状态文案 */
  current_status_text?: string
  /** 状态文案 */
  status_text?: string
  /** 创建时间戳 */
  add_time?: number
  /** 创建时间文案 */
  add_time_text?: string
  /** 线索类型 */
  lead_type?: number
  /** 线索类型文案 */
  lead_type_text?: string
  /** 联系电话 */
  phone?: string
  /** 客户姓名 */
  real_name?: string
  /** 车牌号 */
  plate_no?: string
  /** 品牌 */
  brand?: string
  /** 车型 */
  model?: string
  /** 车架号 */
  vin?: string
  /** 是否批量：0 否 / 1 是 */
  is_batch?: number
  /** 批量车辆数量 */
  batch_vehicle_count?: number
  /** 批量展示文案 */
  batch_display?: string
  /** 回收方式：tow 上门拖车 / self 自行送厂 */
  delivery_type?: string
  /** 结算金额/预估残值 */
  settlement_amount?: number | string
  /** 创建人 */
  creator_name?: string
  /** 跟进业务员 ID */
  business_id?: number
  /** 是否已跟进：0 否 / 1 是 */
  is_follow?: number
  /** 车辆状态码 */
  vehicle_status?: number
  /** 车辆状态文案 */
  vehicle_status_text?: string
  /** 司机电话 */
  driver_phone?: string
  /** 已指派司机电话 */
  assigned_driver_phone?: string
  /** 订单来源 */
  source?: string
  /** 备注 */
  remark?: string
  [key: string]: unknown
}

/** 列表搜索参数 */
export interface OrderSearchParams extends Api.Common.CommonSearchParams {
  page?: number
  limit?: number
  tab?: OrderTab
  keyword?: string
  orderSource?: FormalOrderSource
  orderStatus?: FormalOrderStatusFilter
  signStatus?: SignFilter
  batchType?: BatchTypeFilter
  leadFollowStatus?: LeadFollowFilter
  leadType?: LeadTypeFilter
  towingStatus?: TowingStatusFilter
  progress?: ProgressFilter
}

/** 分页列表响应 */
export type OrderList = Api.Common.PaginatedResponse<RecycleOrder>

/** Tab 统计 */
export interface OrderTabCount {
  tab: OrderTab
  label: string
  count: number
}

/** 订单类型展示样式（按接口 order_type） */
export const ORDER_TYPE_STYLE: Record<string, { color: string; bgColor: string }> = {
  vehicle_lead: { color: '#FA8C16', bgColor: '#FFF7E6' },
  customer_lead: { color: '#EB2F96', bgColor: '#FFF0F6' },
  customer_order: { color: '#722ED1', bgColor: '#F9F0FF' },
  staff_order: { color: '#1890FF', bgColor: '#E6F7FF' },
  tow: { color: '#13C2C2', bgColor: '#E6FFFB' }
}

/** Tab 配置 */
export const ORDER_TAB_CONFIG: Array<{ tab: OrderTab; label: string; icon: string }> = [
  { tab: 'all', label: '全部订单', icon: 'ri:file-list-3-line' },
  { tab: 'lead', label: '线索订单', icon: 'ri:lightbulb-line' },
  { tab: 'formal_order', label: '正式回收订单', icon: 'ri:file-text-line' },
  { tab: 'towing', label: '拖车订单', icon: 'ri:truck-line' }
]

/** 是否线索订单 */
export function isLeadOrder(row: RecycleOrder) {
  return row.order_type === 'vehicle_lead' || row.order_type === 'customer_lead'
}

/** 是否拖车订单 */
export function isTowOrder(row: RecycleOrder) {
  return row.order_type === 'tow'
}

/** 获取展示编号 */
export function getOrderDisplayNo(row: RecycleOrder) {
  return row.order_no || row.tow_no || String(row.id)
}

/** 获取订单类型标签样式 */
export function resolveOrderTypeStyle(row: RecycleOrder) {
  const style = ORDER_TYPE_STYLE[row.order_type]
  return {
    label: row.order_type_text || row.order_type,
    color: style?.color || '#8C8C8C',
    bgColor: style?.bgColor || '#F5F5F5'
  }
}

/** 获取状态展示文案 */
export function getOrderStatusText(row: RecycleOrder) {
  return row.current_status_text || row.status_text || '—'
}

/** 线索跟进状态判断（接口字段） */
export function isLeadPending(row: RecycleOrder) {
  return row.status === 0 && Number(row.is_follow) === 0 && !Number(row.business_id)
}

export function isLeadAssigned(row: RecycleOrder) {
  return row.status === 0 && Number(row.business_id) > 0 && Number(row.is_follow) === 0
}

export function isLeadViewed(row: RecycleOrder) {
  return row.status === 0 && Number(row.is_follow) === 1
}
