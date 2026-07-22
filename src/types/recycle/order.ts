/** 列表 Tab */
export type OrderTab = 'all' | 'lead' | 'formal_order' | 'towing' | 'pending_review'

/** 正式回收订单筛选 */
export type FormalOrderSource = 'all' | 'customer' | 'staff'
export type FormalOrderStatusFilter =
  'all' | 'pending_review' | 'approved' | 'rejected' | 'completed'
export type SignFilter = 'all' | 'pending_sign' | 'signed'
export type BatchTypeFilter = 'all' | 'single' | 'batch'

/** 线索订单筛选 */
export type LeadFollowFilter = 'all' | 'pending' | 'assigned' | 'viewed'
export type LeadTypeFilter = 'all' | 'vehicle' | 'customer'

/** 拖车订单筛选 */
export type TowingStatusFilter =
  'all' | 'pending_dispatch' | 'pending_towing' | 'towing' | 'completed'

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
  /** 待签名附件数量（列表扩展字段，有则直接展示） */
  pending_sign_count?: number
  /** 未签附件数量（列表扩展字段别名） */
  unsigned_attach_count?: number
  /** 是否成交：1 已成交 / 0 意向单 */
  is_deal?: number
  [key: string]: unknown
}

/** 列表搜索参数 */
/** 订单列表搜索参数 */
export interface OrderSearchParams extends Api.Common.CommonSearchParams {
  /** 页码 */
  page?: number
  /** 每页条数 */
  limit?: number
  /** 当前 tab 类型，决定列表类别 */
  tab?: OrderTab
  /** 关键词 */
  keyword?: string
  /** 订单来源（正式订单专用） */
  orderSource?: FormalOrderSource
  /** 订单状态（正式订单专用） */
  orderStatus?: FormalOrderStatusFilter
  /** 签约状态筛选 */
  signStatus?: SignFilter
  /** 批量类型筛选 */
  batchType?: BatchTypeFilter
  /** 跟进状态（线索专用） */
  leadFollowStatus?: LeadFollowFilter
  /** 线索类型筛选 */
  leadType?: LeadTypeFilter
  /** 拖车状态筛选 */
  towingStatus?: TowingStatusFilter
  /** 订单进度 */
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

/** 获取订单类型展示文案（is_deal=0 为意向单） */
export function getOrderTypeDisplayLabel(row: RecycleOrder): string {
  if (Number(row.is_deal) === 0) return '意向单'
  return row.order_type_text || row.order_type
}

/** 获取订单类型标签样式 */
export function resolveOrderTypeStyle(row: RecycleOrder) {
  if (Number(row.is_deal) === 0) {
    return {
      label: '意向单',
      color: '#FA8C16',
      bgColor: '#FFF7E6'
    }
  }
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

/** 正式回收单待审核（status=1） */
export function isPendingFormalReview(row: RecycleOrder) {
  return ['customer_order', 'staff_order'].includes(row.order_type) && Number(row.status) === 1
}

/** 订单车辆项（接口原字段） */
export interface OrderVehicle {
  /** 车辆 ID */
  id?: number
  /** 车牌号 */
  plate_no?: string
  /** 车架号 */
  vin?: string
  /** 品牌 */
  brand?: string
  /** 车型 */
  model?: string
  /** 燃料类型 */
  fuel_type?: string
  /** 排放标准 */
  emission_standard?: string
  /** 登记日期 */
  reg_date?: string
  /** 出厂年份（详情扩展） */
  vehicle_year?: string
  /** 车身颜色 */
  color?: string
  /** 里程 */
  mileage?: string | number
  /** 车辆物流状态码 */
  status?: number
  /** 车辆物流状态文案 */
  status_text?: string
  /** 该车辆订单附件（详情接口挂在 vehicles[] 每项） */
  attachments?: OrderAttachment[]
  [key: string]: unknown
}

/** 当前选中车辆的 attachments（详情数据在 vehicles[].attachments） */
export function resolveVehicleAttachments(
  detail: Partial<OrderDetail>,
  vehicleIdx = 0
): OrderAttachment[] {
  const vehicles = detail.vehicles
  if (vehicles?.length) {
    const v = vehicles[vehicleIdx] ?? vehicles[0]
    const list = v?.attachments
    return Array.isArray(list) ? list : []
  }
  const list = detail.vehicle?.attachments
  return Array.isArray(list) ? list : []
}

/** 订单下全部车辆附件（按 id 去重，签名页用） */
export function resolveOrderAttachmentsAll(detail: Partial<OrderDetail>): OrderAttachment[] {
  const map = new Map<number, OrderAttachment>()
  for (const v of detail.vehicles ?? []) {
    for (const a of v.attachments ?? []) {
      if (a.id != null) map.set(a.id, a)
    }
  }
  if (map.size) return [...map.values()]
  return resolveVehicleAttachments(detail, 0)
}

/** 订单操作日志（status_logs[] 每项） */
export interface OrderStatusLog {
  /** 日志 ID */
  id?: number
  /** 订单 ID */
  oid?: number
  /** 变更前状态 */
  from_status?: number
  /** 变更后状态 */
  to_status?: number
  /** 变更描述 */
  change_message?: string
  /** 变更时间（时间戳） */
  change_time?: number
  /** 操作人 ID */
  operator_id?: number
  /** 操作人名称 */
  operator_name?: string
  /** 操作人类型：admin / user / system */
  operator_type?: string
  [key: string]: unknown
}

/** 订单附件（attachments[] 每项） */
export interface OrderAttachment {
  /** 附件 ID */
  id?: number
  /** 附件名称（后端 name 字段） */
  name?: string
  /** 附件文件名 */
  filename?: string
  /** 附件下载/查看地址（download_url，PDF 生成后有值） */
  download_url?: string
  /** 上传的签名附件地址（upload_url） */
  upload_url?: string
  /** 签名图片地址 */
  sign_url?: string
  /** 签名操作人 */
  sign_by?: string
  /** 签名状态：0=待签 1=已签 */
  sign_status?: number
  /** 签名时间（格式化字符串） */
  sign_time?: string
  /** 推送时间（格式化字符串） */
  push_time?: string
  /** 是否已签（后端计算字段 sign_status==1） */
  signed?: boolean
  /** 附件类型：template=可下载模板，other=其他 */
  attachment_type?: string
  [key: string]: unknown
}

/** 签名模板 */
export interface SignatureTemplate {
  /** 模板 ID */
  id: number
  /** 模板名称 */
  name: string
  /** 签名图片地址 */
  sign_url: string
  /** 创建时间（时间戳） */
  add_time?: number
  /** 更新时间（时间戳） */
  update_time?: number
}

/** 订单详情（接口原字段） */
export interface OrderDetail extends RecycleOrder {
  /** 联系地址 */
  address?: string
  /** 客户 UID */
  uid?: number
  /** 取车联系人 */
  pickup_contact_name?: string
  /** 取车联系电话 */
  pickup_contact_phone?: string
  /** 取车地址 */
  pickup_address?: string
  /** 结算方式 */
  settlement_method?: string
  /** 缺件扣款：0 否 / 1 是 */
  deduct_missing?: number
  /** 自送费补贴 */
  self_delivery_subsidy?: number | string
  /** 回收单价 */
  unit_price?: number | string
  /** 车主类型：personal / company */
  owner_type?: string
  /** 是否有代理人 */
  has_agent?: number
  /** 代理人姓名 */
  agent_name?: string
  /** 代理人电话 */
  agent_phone?: string
  /** 代理服务费 */
  agent_fee?: number | string
  /** 代理发票号 */
  agent_invoice_no?: string
  /** 开户行 */
  bank_name?: string
  /** 银行卡号 */
  bank_card_number?: string
  /** 开户姓名 */
  bank_account_name?: string
  /** 关联车辆列表 */
  vehicles?: OrderVehicle[]
  /** 首辆车（详情扩展） */
  vehicle?: OrderVehicle
  /** 操作/状态日志列表 */
  status_logs?: OrderStatusLog[]
  /** 附件列表 */
  attachments?: OrderAttachment[]
  /** 指派业务员名称 */
  assign_name?: string
  /** 指派业务员电话 */
  assign_phone?: string
  /** 线索跟进人名称 */
  follow_person_name?: string
  /** 线索跟进时间 */
  follow_time?: string
  /** 司机姓名（拖车订单） */
  driver_name?: string
  /** 关联订单客户姓名（拖车订单详情） */
  order_real_name?: string
  /** 关联订单客户电话（拖车订单详情） */
  order_phone?: string
  /** 关联订单车牌号（拖车订单详情） */
  order_plate_no?: string
  /** 关联订单 VIN（拖车订单详情） */
  order_vin?: string
  /** 品牌车型拼接文案（拖车订单详情） */
  brand_model?: string
  /** 拖车司机 ID */
  driver_id?: number
  /** 派单时间（时间戳或格式化字符串，拖车订单） */
  dispatch_time?: number | string
  /** 派单人姓名（拖车订单） */
  dispatch_by?: string
  /** 接单时间（时间戳或格式化字符串，拖车订单） */
  accept_time?: number | string
  /** 出发时间（拖车订单） */
  depart_time?: number | string
  /** 拖车完成时间（时间戳或格式化字符串，拖车订单） */
  completion_time?: number | string
  /** 拖车完成时间（后端实际字段） */
  complete_time?: number | string
  /** 送达地址/目的厂区地址（拖车订单） */
  delivery_address?: string
  /** 到达照片列表（拖车订单，司机在小程序上传） */
  completion_photos?: string[] | string
  /** 到达照片列表（后端实际字段 images） */
  images?: string[] | string
  /** 司机电子签名图片 URL（拖车订单） */
  driver_signature?: string
  /** 拖车操作日志（后端 tow/detail 合并日志） */
  operation_logs?: Array<{
    action?: string
    content?: string
    operator_id?: number
    operator_name?: string
    operator_role?: string
    add_time?: number | string
    from_order_status_log?: boolean
    [key: string]: unknown
  }>
}

/** 创建/编辑订单提交参数（与 ScrapOrder/create 一致） */
export interface OrderSavePayload {
  /** 订单 ID，有值则更新 */
  id?: number
  /** 是否批次：0 否 / 1 是 */
  is_batch?: number
  /** 是否已成交：0 意向 / 1 已成交（Service 支持，Controller create 需同步 postMore） */
  is_deal?: number
  /** 订单状态：0 线索 / 1 待审核 */
  status?: number
  /** 残值金额（与 unit_price 二选一传入，Service 会合并） */
  residual_value?: number
  /** 批次车辆数 */
  batch_vehicle_count?: number
  /** 客户姓名 */
  real_name: string
  /** 联系电话 */
  phone: string
  /** 联系地址 */
  address?: string
  /** 交付方式：self / tow */
  delivery_type: 'self' | 'tow'
  /** 取车联系人 */
  pickup_contact_name?: string
  /** 取车联系电话 */
  pickup_contact_phone?: string
  /** 取车地址 */
  pickup_address?: string
  /** 结算方式 */
  settlement_method?: string
  /** 缺件扣款：0 否 / 1 是 */
  deduct_missing?: number
  /** 自送费补贴 */
  self_delivery_subsidy?: number
  /** 回收单价/残值 */
  unit_price?: number
  /** 结算金额 */
  settlement_amount?: number
  /** 车主类型 */
  owner_type: 'personal' | 'non_personal'
  /** 是否有代理人 */
  has_agent?: number
  /** 代理人姓名 */
  agent_name?: string
  /** 代理人电话 */
  agent_phone?: string
  /** 代理服务费 */
  agent_fee?: number
  /** 代理发票号 */
  agent_invoice_no?: string
  /** 开户行 */
  bank_name?: string
  /** 银行卡号 */
  bank_card_number?: string
  /** 开户姓名 */
  bank_account_name?: string
  /** 车辆列表 */
  vehicles?: OrderVehicle[]
  /** 备注 */
  remark?: string
  /** 客户 UID */
  uid?: number
}

/** 创建订单响应 */
export interface OrderSaveResult {
  /** 订单 ID */
  id?: number
  /** 订单编号 */
  order_no?: string
}

/** 编辑订单 — 车辆块（/scrap/order/update vehicle） */
export interface OrderUpdateVehiclePayload {
  /** 车牌号 */
  plate_no?: string
  /** 车架号 */
  vin?: string
  /** 品牌 */
  brand?: string
  /** 型号 */
  model?: string
  /** 出厂年份 */
  vehicle_year?: string | number
  /** 车身颜色 */
  color?: string
  /** 车辆类型/燃料 */
  vehicle_type?: string
  /** 里程 */
  mileage?: string | number
  /** 初次登记日期 */
  first_reg_date?: string
  /** 交付方式 self / tow */
  delivery_type?: 'self' | 'tow'
  /** 送车人姓名（self） */
  pickup_name?: string
  /** 送车人电话（self） */
  pickup_phone?: string
}

/** 编辑订单 — 客户块 */
export interface OrderUpdateCustomerPayload {
  /** 姓名 */
  real_name?: string
  /** 电话 */
  phone?: string
  /** 地址 */
  address?: string
  /** 身份证号 */
  id_card?: string
}

/** 编辑订单 — 结算块 */
export interface OrderUpdateSettlementPayload {
  /** personal / company（对应 owner_type） */
  settlement_type?: 'personal' | 'company'
  /** 结算方式 */
  settlement_method?: string
  /** 单价/残值 */
  unit_price?: number | string
  /** 自送补贴 */
  self_delivery_subsidy?: number | string
  /** 是否缺件免扣款 */
  deduct_missing?: boolean | number
  /** 发票金额 */
  invoice_amount?: number | string
  /** 发票号码 */
  invoice_no?: string
}

/** 编辑订单 — 代理人块 */
export interface OrderUpdateAgentPayload {
  /** 代理人姓名 */
  agent_name?: string
  /** 代理人电话 */
  agent_phone?: string
  /** 服务费 */
  agent_fee?: number | string
  /** 服务费发票号 */
  agent_invoice_no?: string
}

/** 编辑订单 — 银行卡块 */
export interface OrderUpdateBankPayload {
  /** 开户名 */
  bank_account_name?: string
  /** 开户行 */
  bank_name?: string
  /** 卡号 */
  bank_card_number?: string
}

/** 编辑订单提交（/scrap/order/update） */
export interface OrderUpdatePayload {
  /** 订单 ID */
  id: number
  /** 当前编辑的车辆 ID */
  vehicle_id?: number
  /** 车辆字段 */
  vehicle?: OrderUpdateVehiclePayload
  /** 客户字段 */
  customer?: OrderUpdateCustomerPayload
  /** 结算字段 */
  settlement?: OrderUpdateSettlementPayload
  /** 代理人字段 */
  agent?: OrderUpdateAgentPayload
  /** 银行卡字段 */
  bank?: OrderUpdateBankPayload
  /** 是否有代理人（变化时传 0/1） */
  has_agent?: number | boolean
  /** 备注 */
  remark?: string
}

/** 线索跟进人（/scrap/lead/follow_persons 返回） */
export interface LeadFollowPerson {
  /** 用户 UID */
  uid: number
  /** 昵称 */
  nickname?: string
  /** 真实姓名 */
  real_name?: string
  /** 手机号 */
  phone?: string
  /** 头像 */
  avatar?: string
}

/** 拖车司机记录（/scrap/tow/driver/list 返回） */
export interface TowDriverRecord {
  /** 司机记录 ID */
  id: number
  /** 司机姓名 */
  driver_name?: string
  /** 司机电话 */
  driver_phone?: string
  /** 拖车车牌 */
  truck_plate?: string
  /** 拖车公司 */
  tow_company?: string
  /** 后端拼接展示文案 */
  label?: string
  /** 关联用户 ID */
  user_id?: number
  [key: string]: unknown
}
