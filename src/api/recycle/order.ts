import request from '@/utils/http'
import type {
  OrderDetail,
  OrderList,
  OrderSavePayload,
  OrderSaveResult,
  OrderSearchParams,
  OrderTab,
  OrderTabCount,
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

/** 线索指派：后端暂无独立筛选，用接口字段本地过滤 */
function applyLeadAssignedFilter(list: RecycleOrder[], params: OrderSearchParams) {
  if (params.tab !== 'lead' || params.leadFollowStatus !== 'assigned') return list
  return list.filter(
    (item) => item.status === 0 && Number(item.business_id) > 0 && Number(item.is_follow) === 0
  )
}

/** 批量类型：后端暂无 is_batch 筛选，用接口字段本地过滤 */
function applyBatchFilter(list: RecycleOrder[], params: OrderSearchParams) {
  if (!params.batchType || params.batchType === 'all') return list
  if (params.batchType === 'single') return list.filter((item) => !Number(item.is_batch))
  return list.filter((item) => Number(item.is_batch) === 1)
}

/** 获取订单列表 */
export async function fetchOrderList(params: OrderSearchParams): Promise<OrderList> {
  const { page, limit } = resolvePagination(params)
  const res = await request.get<{ list: RecycleOrder[]; count: number }>({
    url: '/scrap/order/list',
    params: buildListParams(params)
  })

  let records = res.list || []
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

/** 订单详情 */
export function fetchOrderDetail(id: number) {
  return request.get<OrderDetail>({
    url: `/scrap/order/detail/${id}`
  })
}

/** 创建/编辑订单（传 id 则更新） */
export function fetchSaveOrder(data: OrderSavePayload) {
  const isEdit = Boolean(data.id)
  return request.post<OrderSaveResult>({
    url: '/scrap/order/create',
    params: data,
    showSuccessMessage: isEdit
  })
}
