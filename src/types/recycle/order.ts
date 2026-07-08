/** 订单类型 */
export type OrderType = 'lead' | 'customer' | 'staff' | 'towing'

/** 线索子类型 */
export type LeadType = 'vehicle' | 'customer'

/** 线索订单状态 */
export type LeadOrderStatus = 'pending' | 'assigned' | 'viewed'

/** 客户订单商流状态 */
export type CustomerOrderStatus = 'pending_review' | 'approved' | 'rejected' | 'completed'

/** 正式订单物流状态 */
export type FormalOrderStatus =
  | 'pending_entry'
  | 'towing_pending'
  | 'towing'
  | 'towing_completed'
  | 'inspecting'
  | 'dismantling'
  | 'canceling'
  | 'canceled'
  | 'completed'

/** 拖车订单状态 */
export type TowingOrderStatus = 'pending_dispatch' | 'pending_towing' | 'towing' | 'completed'

/** 订单状态（原型统一 status 字段） */
export type OrderStatus =
  | LeadOrderStatus
  | CustomerOrderStatus
  | FormalOrderStatus
  | TowingOrderStatus

/** 列表 Tab（与原型 MainTab 一致） */
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

/** 订单列表项（字段对齐原型 Order 联合类型） */
export interface RecycleOrder {
  /** 展示编号（order_no / tow_no） */
  id: string
  /** 接口用数字 ID */
  rawId: number
  orderType: OrderType
  status: OrderStatus
  /** 后端 current_status_text */
  statusText?: string
  createTime: string
  /** 线索 */
  leadType?: LeadType
  phone?: string
  ownerName?: string
  /** 车辆 */
  plateNumber: string
  brand?: string
  model?: string
  vin?: string
  /** 客户 */
  customerName: string
  customerPhone: string
  /** 批量 */
  isBatch?: boolean
  vehicleCount?: number
  /** 待审核 */
  deliveryMethod?: 'self' | 'tow'
  estimatedAmount?: string
  /** 签名 */
  isSigned?: boolean
  needSign?: boolean
  /** 创建人展示名 */
  createdBy?: string
  creatorName?: string
  /** 拖车 */
  driverPhone?: string
  linkedOrderId?: string
  remark?: string
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

/** 订单类型展示配置（来自原型 ORDER_TYPE_CONFIG） */
export const ORDER_TYPE_CONFIG: Record<
  OrderType,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  lead: { label: '线索', color: '#FA8C16', bgColor: '#FFF7E6', icon: 'ri:lightbulb-line' },
  customer: { label: '客户订单', color: '#722ED1', bgColor: '#F9F0FF', icon: 'ri:user-line' },
  staff: { label: '员工订单', color: '#1890FF', bgColor: '#E6F7FF', icon: 'ri:briefcase-line' },
  towing: { label: '拖车单', color: '#13C2C2', bgColor: '#E6FFFB', icon: 'ri:truck-line' }
}

/** 线索子类型展示配置（来自原型 LEAD_TYPE_CONFIG） */
export const LEAD_TYPE_CONFIG: Record<LeadType, { label: string; color: string; bgColor: string }> =
  {
    vehicle: { label: '车辆线索', color: '#FA8C16', bgColor: '#FFF7E6' },
    customer: { label: '客户线索', color: '#EB2F96', bgColor: '#FFF0F6' }
  }

/** 状态文案映射（来自原型 STATUS_TEXT） */
export const STATUS_TEXT: Record<string, string> = {
  pending: '待跟进',
  assigned: '线索指派',
  viewed: '已跟进',
  pending_review: '待审核',
  approved: '审核通过',
  rejected: '已驳回',
  created_formal: '已创建正式订单',
  pending_entry: '待入厂',
  towing_pending: '拖车待接单',
  towing: '拖车中',
  towing_completed: '拖车完成',
  inspecting: '入厂查验中',
  dismantling: '拆解中',
  canceling: '注销中',
  canceled: '已注销',
  completed: '已完成',
  pending_dispatch: '待派单',
  pending_towing: '待拖车'
}

/** 状态颜色配置（来自原型 STATUS_COLOR） */
export const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  pending: { text: '#FA8C16', bg: '#FFF7E6' },
  assigned: { text: '#1677ff', bg: '#e6f4ff' },
  pending_review: { text: '#1890FF', bg: '#E6F7FF' },
  approved: { text: '#52C41A', bg: '#F6FFED' },
  rejected: { text: '#FF4D4F', bg: '#FFF1F0' },
  viewed: { text: '#8C8C8C', bg: '#FAFAFA' },
  created_formal: { text: '#52C41A', bg: '#F6FFED' },
  pending_entry: { text: '#1890FF', bg: '#E6F7FF' },
  towing_pending: { text: '#FAAD14', bg: '#FFFBE6' },
  towing: { text: '#1890FF', bg: '#E6F7FF' },
  towing_completed: { text: '#52C41A', bg: '#F6FFED' },
  inspecting: { text: '#722ED1', bg: '#F9F0FF' },
  dismantling: { text: '#FA8C16', bg: '#FFF7E6' },
  canceling: { text: '#D4380D', bg: '#FFF2E8' },
  canceled: { text: '#52C41A', bg: '#F6FFED' },
  completed: { text: '#87D068', bg: '#F6FFED' },
  pending_dispatch: { text: '#FAAD14', bg: '#FFFBE6' },
  pending_towing: { text: '#1890FF', bg: '#E6F7FF' }
}

/** Tab 配置（与原型 renderTabNavigation 一致，4 个主 Tab） */
export const ORDER_TAB_CONFIG: Array<{ tab: OrderTab; label: string; icon: string }> = [
  { tab: 'all', label: '全部订单', icon: 'ri:file-list-3-line' },
  { tab: 'lead', label: '线索订单', icon: 'ri:lightbulb-line' },
  { tab: 'formal_order', label: '正式回收订单', icon: 'ri:file-text-line' },
  { tab: 'towing', label: '拖车订单', icon: 'ri:truck-line' }
]

/** 获取订单类型标签配置 */
export function resolveOrderTypeStyle(order: RecycleOrder) {
  if (order.orderType === 'lead' && order.leadType) {
    return LEAD_TYPE_CONFIG[order.leadType]
  }
  return ORDER_TYPE_CONFIG[order.orderType]
}

/** 手机号脱敏（原型 maskPhone） */
export function maskPhone(phone: string) {
  if (phone.length === 11) return `${phone.slice(0, 3)}****${phone.slice(7)}`
  return phone
}

/** 获取客户信息（原型 getOrderCustomerInfo） */
export function getOrderCustomerInfo(order: RecycleOrder) {
  if (order.orderType === 'lead') {
    return {
      name: order.ownerName || (order.leadType === 'customer' ? '客户线索' : '—'),
      phone:
        order.leadType === 'customer'
          ? maskPhone(order.phone || order.customerPhone)
          : order.phone || order.customerPhone
    }
  }
  return { name: order.customerName, phone: order.customerPhone }
}

/** 获取车辆展示名（原型 getOrderDisplayName） */
export function getOrderDisplayName(order: RecycleOrder) {
  if (order.orderType === 'lead') {
    return order.leadType === 'vehicle' && order.plateNumber
      ? order.plateNumber
      : order.phone || '—'
  }
  return order.plateNumber || '—'
}

/** 获取车辆信息（原型 getOrderVehicleInfo） */
export function getOrderVehicleInfo(order: RecycleOrder) {
  if (order.orderType === 'lead') {
    if (order.leadType === 'vehicle' && order.brand && order.model) {
      return `${order.brand} ${order.model}`
    }
    return '—'
  }
  if (order.brand && order.model) return `${order.brand} ${order.model}`
  return '—'
}

/** 获取创建人/提交人/线索来源（原型 getOrderCreator） */
export function getOrderCreator(order: RecycleOrder) {
  if (order.creatorName) return order.creatorName
  if (order.orderType === 'lead') return '系统'
  if (order.orderType === 'customer') return order.customerName
  if (order.orderType === 'staff') return order.createdBy || '—'
  if (order.orderType === 'towing') return '系统自动生成'
  return '—'
}

/** 获取状态展示文案 */
export function getOrderStatusText(order: RecycleOrder) {
  return order.statusText || STATUS_TEXT[order.status] || order.status
}
