import request from '@/utils/http'
import type {
  OrderList,
  OrderSearchParams,
  OrderTab,
  OrderTabCount,
  OrderType,
  RecycleOrder
} from '@/types/recycle/order'
import { ORDER_TAB_CONFIG } from '@/types/recycle/order'

function resolvePagination(params: OrderSearchParams) {
  return {
    page: Number(params.page ?? params.current ?? 1),
    limit: Number(params.limit ?? params.size ?? 20)
  }
}

/** 前端 Tab → 后端 tab */
function mapTabToApi(tab: OrderTab = 'all') {
  if (tab === 'formal_order' || tab === 'pending_review') return 'order'
  if (tab === 'towing') return 'tow'
  return tab
}

/** 构建列表请求参数（字段与后端 getMore 一致，无值也传空） */
function buildListParams(params: OrderSearchParams) {
  const { page, limit } = resolvePagination(params)
  const tab = params.tab || 'all'
  const apiTab = mapTabToApi(tab)

  const orderStatusMap: Record<string, number | ''> = {
    all: '',
    pending_review: 1,
    approved: 2,
    rejected: -1,
    completed: 3
  }

  const sourceMap: Record<string, string> = {
    all: '',
    customer: 'miniapp',
    staff: 'admin'
  }

  const signStatusMap: Record<string, number | ''> = {
    all: '',
    pending_sign: 0,
    signed: 1
  }

  const leadTypeMap: Record<string, number | ''> = {
    all: '',
    vehicle: 1,
    customer: 2
  }

  const followStatusMap: Record<string, number | ''> = {
    all: '',
    pending: 0,
    assigned: '',
    viewed: 1
  }

  const progressMap: Record<string, string> = {
    all: '',
    ongoing: 'in_progress',
    finished: 'completed'
  }

  const towStatusMap: Record<string, number | ''> = {
    all: '',
    pending_dispatch: 1,
    pending_towing: 2,
    towing: 3,
    completed: 4
  }

  let orderStatus: number | '' = orderStatusMap[params.orderStatus || 'all'] ?? ''
  if (tab === 'pending_review') {
    orderStatus = 1
  }

  return {
    page,
    limit,
    tab: apiTab,
    status: '',
    keyword: params.keyword?.trim() || '',
    lead_type: leadTypeMap[params.leadType || 'all'] ?? '',
    plate_no: '',
    vin: '',
    start_time: '',
    end_time: '',
    order_progress: progressMap[params.progress || 'all'] ?? '',
    source: sourceMap[params.orderSource || 'all'] ?? '',
    recycle_type: '',
    sign_status: signStatusMap[params.signStatus || 'all'] ?? '',
    tow_status: towStatusMap[params.towingStatus || 'all'] ?? '',
    follow_status: followStatusMap[params.leadFollowStatus || 'all'] ?? '',
    order_status: orderStatus
  }
}

/** 映射后端订单类型 */
function mapOrderType(raw: Record<string, unknown>): OrderType {
  const type = String(raw.order_type || '')
  if (type === 'tow') return 'towing'
  if (type === 'vehicle_lead' || type === 'customer_lead') return 'lead'
  if (type === 'staff_order') return 'staff'
  return 'customer'
}

/** 映射前端状态 key */
function mapOrderStatus(raw: Record<string, unknown>, orderType: OrderType) {
  const orderStatus = Number(raw.status ?? 0)

  if (orderType === 'lead') {
    if (Number(raw.is_follow) === 1) return 'viewed'
    if (Number(raw.business_id) > 0) return 'assigned'
    return 'pending'
  }

  if (orderType === 'towing') {
    const s = Number(raw.status)
    if (s === 1) return 'pending_dispatch'
    if (s === 2) return 'pending_towing'
    if (s === 3) return 'towing'
    if (s === 4) return 'completed'
    return 'pending_dispatch'
  }

  if (orderStatus === 1) return 'pending_review'
  if (orderStatus === 2) return 'approved'
  if (orderStatus === -1) return 'rejected'
  if (orderStatus === 3) return 'completed'

  const vehicleStatus = Number(raw.vehicle_status)
  const vehicleMap: Record<number, string> = {
    1: 'pending_entry',
    2: 'inspecting',
    3: 'dismantling',
    4: 'canceling',
    5: 'completed'
  }
  return vehicleMap[vehicleStatus] || 'approved'
}

/** 列表项字段映射 */
function mapOrderItem(raw: Record<string, unknown>): RecycleOrder {
  const orderType = mapOrderType(raw)
  const rawId = Number(raw.id || 0)
  const leadTypeNum = Number(raw.lead_type ?? 0)

  return {
    rawId,
    id: String(raw.order_no || raw.tow_no || raw.id || ''),
    orderType,
    status: mapOrderStatus(raw, orderType) as RecycleOrder['status'],
    statusText: String(raw.current_status_text || raw.status_text || ''),
    createTime: String(raw.add_time_text || raw.create_time || ''),
    leadType: leadTypeNum === 1 ? 'vehicle' : leadTypeNum === 2 ? 'customer' : undefined,
    phone: String(raw.phone || ''),
    ownerName: String(raw.real_name || raw.owner_name || ''),
    plateNumber: String(raw.plate_no || '—'),
    brand: String(raw.brand || ''),
    model: String(raw.model || ''),
    vin: String(raw.vin || ''),
    customerName: String(raw.real_name || raw.customer_name || raw.owner_name || '—'),
    customerPhone: String(raw.phone || raw.customer_phone || ''),
    isBatch: Boolean(Number(raw.is_batch || 0)),
    vehicleCount: Number(raw.batch_vehicle_count || 0) || undefined,
    deliveryMethod: raw.delivery_type === 'tow' ? 'tow' : 'self',
    estimatedAmount: raw.settlement_amount
      ? String(raw.settlement_amount)
      : raw.estimated_amount
        ? String(raw.estimated_amount)
        : undefined,
    isSigned: Boolean(Number(raw.is_signed || 0)),
    needSign: Boolean(Number(raw.need_sign || 0)),
    createdBy: String(raw.created_by || ''),
    creatorName: String(raw.creator_name || ''),
    driverPhone: String(raw.driver_phone || raw.assigned_driver_phone || ''),
    linkedOrderId: raw.linked_order_id ? String(raw.linked_order_id) : undefined,
    remark: String(raw.remark || '')
  }
}

/** 线索指派状态客户端过滤 */
function applyLeadAssignedFilter(list: RecycleOrder[], params: OrderSearchParams) {
  if (params.tab !== 'lead' || params.leadFollowStatus !== 'assigned') return list
  return list.filter((item) => item.status === 'assigned')
}

/** 批量类型客户端过滤（后端暂无 is_batch 筛选） */
function applyBatchFilter(list: RecycleOrder[], params: OrderSearchParams) {
  if (!params.batchType || params.batchType === 'all') return list
  if (params.batchType === 'single') return list.filter((item) => !item.isBatch)
  return list.filter((item) => item.isBatch)
}

/** 获取订单列表 */
export async function fetchOrderList(params: OrderSearchParams): Promise<OrderList> {
  const { page, limit } = resolvePagination(params)
  const res = await request.get<{ list: Record<string, unknown>[]; count: number }>({
    url: '/scrap/order/list',
    params: buildListParams(params)
  })

  let records = (res.list || []).map(mapOrderItem)
  records = applyLeadAssignedFilter(records, params)
  records = applyBatchFilter(records, params)

  return {
    records,
    total: res.count || records.length,
    current: page,
    size: limit
  }
}

/** 获取 Tab 统计 */
export async function fetchOrderTabCounts(): Promise<OrderTabCount[]> {
  const res = await request.get<Record<string, number>>({
    url: '/scrap/order/counts'
  })

  const countMap: Record<OrderTab, number> = {
    all: res.all || 0,
    lead: res.lead || 0,
    formal_order: res.order || 0,
    towing: res.tow || 0,
    pending_review: res.pending_audit || 0
  }

  return ORDER_TAB_CONFIG.map(({ tab, label }) => ({
    tab,
    label,
    count: countMap[tab] ?? 0
  }))
}

/** 审核订单 */
export function fetchAuditOrder(data: { id: number; approved: boolean; remark?: string }) {
  return request.post({
    url: '/scrap/order/audit',
    params: {
      id: data.id,
      approved: data.approved ? 1 : 0,
      remark: data.remark || ''
    },
    showSuccessMessage: true
  })
}

/** 指派线索跟进人 */
export function fetchAssignLeadFollow(data: { id: number; followUid: number }) {
  return request.post({
    url: '/scrap/lead/assign_follow',
    params: { id: data.id, follow_uid: data.followUid },
    showSuccessMessage: true
  })
}

/** 获取跟进人列表 */
export async function fetchLeadFollowPersons(keyword = '') {
  const res = await request.get<{ list: Array<{ uid: number; nickname: string; phone?: string }> }>(
    {
      url: '/scrap/lead/follow_persons',
      params: { keyword, page: 1, limit: 50 }
    }
  )
  return res.list || []
}

/** 更新拖车状态 */
export function fetchUpdateTowStatus(id: number, status: number) {
  return request.post({
    url: `/scrap/tow/update_status/${id}`,
    params: { status },
    showSuccessMessage: true
  })
}

/** 导出用：拉取全量列表 */
export async function fetchOrderListForExport(
  params: Omit<OrderSearchParams, 'current' | 'size'>
): Promise<RecycleOrder[]> {
  const res = await fetchOrderList({ ...params, current: 1, size: 9999 })
  return res.records
}
