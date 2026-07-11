// ==================== 领料管理 ====================

/** 领料状态：1待领料 2已领料出库 */
export type MaterialStatus = 1 | 2

/** 领料列表项（直接使用接口字段） */
export interface MaterialItem {
  /** 入库记录ID */
  id: number
  /** 车辆ID */
  vehicle_id?: number
  /** 订单ID */
  order_id?: number
  /** 库位ID */
  location_id?: number
  /** 档案号（接口映射 order_no） */
  archive_no?: string
  /** 车牌号 */
  plate_no?: string
  /** 品牌 */
  brand_name?: string
  /** 车型 */
  model_name?: string
  /** 年份 */
  year?: string
  /** 燃料类型文案 */
  fuel_type_text?: string
  /** 车主姓名 */
  owner_name?: string
  /** 库位名称 */
  location_name?: string
  /** 区域 */
  area?: string
  /** 仓库名称 */
  warehouse_name?: string
  /** 入库单号 */
  entry_no?: string
  /** 入库时间 */
  entry_time?: string
  /** 出库单号 */
  outbound_no?: string
  /** 出库时间 */
  outbound_time?: string
  /** 领料人 */
  receiver?: string
  /** 领料人ID */
  receiver_id?: number
  /** 状态码 */
  status: MaterialStatus
  /** 状态文案 */
  status_text?: string
  /** 拆解员 */
  dismantler?: string
  /** 订单号 */
  order_no?: string
  [key: string]: unknown
}

/** 领料列表查询参数 */
export interface MaterialSearchParams {
  /** 关键词：车牌/档案号/品牌/库位/车主 */
  keyword?: string
  /** 状态：1待领料 2已领料出库 */
  status?: MaterialStatus | ''
  /** 仓库区域ID */
  warehouse_area_id?: number
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 领料统计 */
export interface MaterialStats {
  /** 待领料数量 */
  pending_count: number
  /** 已领料出库数量 */
  completed_count: number
  /** 今日领料数量 */
  today_count: number
}

/** 领料员工选项 */
export interface MaterialStaffOption {
  /** 用户ID */
  uid: number
  /** 昵称 */
  nickname?: string
  /** 手机号 */
  phone?: string
  /** 头像 */
  avatar?: string
}

/** 领料出库参数 */
export interface MaterialOutboundParams {
  /** 入库记录ID，批量时为逗号分隔如 1,2,3 */
  id: number | string
  /** 领料人ID */
  receiver_id: number
}

/** 批量领料出库返回 */
export interface MaterialBatchOutboundResult {
  /** 出库单号 */
  outbound_no?: string
  /** 出库时间 */
  outbound_time?: string
  /** 成功数量 */
  success_count?: number
  /** 失败数量 */
  failed_count?: number
  /** 失败详情 */
  failed_details?: string[]
  [key: string]: unknown
}

/** 整单退库参数 */
export interface MaterialReturnParams {
  /** 入库记录ID */
  id: number
  /** 退库库位ID */
  location_id: number
}

/** 状态选项 */
export interface MaterialStatusOption {
  value: MaterialStatus
  label: string
}

/** 状态标签配置 */
export const MATERIAL_STATUS_CONFIG: Record<
  MaterialStatus,
  { label: string; color: string; bg: string }
> = {
  1: { label: '待领料', color: '#1677ff', bg: '#E6F7FF' },
  2: { label: '已领料出库', color: '#52C41A', bg: '#F6FFED' }
}

/** 状态筛选选项 */
export const MATERIAL_STATUS_FILTER_OPTIONS = [
  { label: '待领料', value: 1 as MaterialStatus },
  { label: '已领料出库', value: 2 as MaterialStatus }
]
