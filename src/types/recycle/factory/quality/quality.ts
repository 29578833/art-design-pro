/** 质检队列状态 */
export type QueueStatus = 'pending' | 'overdue' | 'in_progress' | 'completed'

/** 质检结果 */
export type QcResult = 0 | 1 | 2 // 0待查验 1合格 2不合格

/** 质检状态 */
export type QcStatus = 1 | 2 // 1质检中 2已完成

/** 质检结论类型 */
export type ConclusionType = 0 | 1 | 2 | 3 // 0未填写 1车况正常 2存在缺件 3需特殊处理

/** 质检项目状态 */
export type ItemStatus = 1 | 2 | 3 // 1完好 2缺失 3损坏

// ==================== 质检队列 ====================

/** 质检队列列表项（直接使用接口字段） */
export interface QualityQueueItem {
  /** 车辆ID */
  vehicle_id: number
  /** VIN码 */
  vin?: string
  /** 车牌号 */
  plate_no?: string
  /** 品牌车型拼接 */
  brand_model?: string
  /** 车辆类型文案 */
  vehicle_type_text?: string
  /** 车主姓名 */
  owner_name?: string
  /** 订单ID */
  order_id: number
  /** 质检记录ID */
  check_id?: number
  /** 质检编号或订单号 */
  inspection_no?: string
  /** 到场时间 */
  arrival_time?: string
  /** 等待时长 */
  wait_duration?: string
  /** 等待小时数 */
  wait_hours?: number
  /** 队列状态 */
  queue_status: QueueStatus
  /** 队列状态文案 */
  queue_status_text?: string
  /** 质检员姓名 */
  inspector_name?: string
  [key: string]: unknown
}

// ==================== 质检报告列表 ====================

/** 质检报告列表项（直接使用接口字段） */
export interface QualityReportItem {
  /** 主键ID */
  id: number
  /** 质检编号 */
  check_no?: string
  /** 订单ID */
  order_id: number
  /** 质检员 */
  inspector?: string
  /** 缺件总扣款 */
  missing_deduction?: number
  /** 质检结果: 0待查验 1合格 2不合格 */
  result: QcResult
  /** 质检时间 */
  check_time?: string
  /** 质检状态: 1质检中 2已完成 */
  qc_status: QcStatus
  /** 车牌号 */
  plate_no?: string
  /** 品牌车型拼接 */
  brand_model?: string
  /** 订单号 */
  order_no?: string
  /** 车主姓名 */
  owner_name?: string
  /** 缺失/损坏件数 */
  missing_count?: number
  [key: string]: unknown
}

// ==================== 质检详情 ====================

/** 质检项目明细项 */
export interface QualityCheckItem {
  /** 项目ID */
  id: number
  /** 质检记录ID */
  check_id: number
  /** 项目名称 */
  item_name: string
  /** 分类 */
  item_category: string
  /** 状态: 1完好 2缺失 3损坏 */
  status: ItemStatus
  /** 损伤程度 */
  damage_level?: string
  /** 扣款金额 */
  deduction_amount?: number
  /** 扣款系数 */
  damage_coefficient?: number
  /** 实际扣款 */
  actual_deduction?: number
  /** 备注 */
  remark?: string
  /** 照片JSON */
  images?: string
  /** 蓄电池数量（节） */
  battery_count?: number
  /** 轮胎轮毂材质：铁 / 铝 */
  tire_material?: string
  /** 创建时间 */
  add_time?: number
}

/** 质检详情（直接使用接口字段） */
export interface QualityDetail {
  /** 主键ID */
  id: number
  /** 订单ID */
  order_id: number
  /** 车辆ID */
  vehicle_id: number
  /** 质检状态: 1质检中 2已完成 */
  qc_status: QcStatus
  /** 质检编号 */
  check_no: string
  /** 质检员ID */
  inspector_id: number
  /** 质检员姓名 */
  inspector_name: string
  /** 质检时间 */
  check_time?: string
  /** 过磅重量(kg) */
  weight: number
  /** 皮重(kg) */
  tare_weight: number
  /** 扣杂(kg) */
  deduction_weight: number
  /** 扣杂照片（逗号分隔 URL） */
  deduction_images?: string
  /** 整车照 */
  full_image?: string
  /** 车架号拓印照 */
  vin_rub_image?: string
  /** 车架号照 */
  vin_image?: string
  /** 发动机照 */
  engine_image?: string
  /** 其他照 */
  other_image?: string
  /** 监销标记: 0否 1是 */
  is_supervision: number
  /** 车辆整体照JSON */
  vehicle_images?: string
  /** 缺件总扣款 */
  total_deduction: number
  /** 总评分 */
  total_score: number
  /** 质检结果: 0待查验 1合格 2不合格 */
  result: QcResult
  /** 质检结论类型 */
  conclusion_type: ConclusionType
  /** 车牌状态(多选逗号) */
  plate_status: string
  /** 厂区车辆类型（dict_value，来自 cllx_cascade 叶子节点） */
  factory_type: string
  /** 备注 */
  remark: string
  /** 质检员签字 URL */
  inspector_signature?: string
  /** 拖车司机签字 URL */
  driver_signature?: string
  /** 车主/代理人签字 URL */
  owner_signature?: string
  /** 质检报告PDF链接 */
  pdf_url?: string
  /** 创建时间 */
  add_time?: number
  /** 更新时间 */
  update_time?: number

  // 关联数据
  /** 质检项目明细 */
  items?: QualityCheckItem[]
  /** 结果文案 */
  result_text?: string
  /** 订单号 */
  order_no?: string
  /** 车主姓名 */
  real_name?: string
  /** 车主电话 */
  phone?: string
  /** 回收类型 */
  recycle_type?: string
  /** 车牌号 */
  plate_no?: string
  /** VIN码 */
  vin?: string
  /** 品牌 */
  brand?: string
  /** 车型 */
  model?: string
  /** 车辆类型 */
  vehicle_type?: string
  /** 燃料类型 */
  fuel_type?: string
  /** 排放标准 */
  emission_standard?: string
  /** 颜色 */
  color?: string
  /** 发动机号 */
  engine_no?: string
  /** 排量 */
  engine_displacement?: string
  /** 变速箱 */
  transmission?: string
  /** 驱动方式 */
  drivetrain?: string
  /** 车主姓名(车辆表) */
  owner_name?: string
  /** 车主身份证 */
  owner_id_card?: string
  /** 到场时间 */
  arrival_time?: string
  [key: string]: unknown
}

// ==================== 质检项目分类 ====================

/** 质检项目项 */
export interface InspectionItem {
  /** 项目ID */
  id: number
  /** 分类ID */
  category_id: number
  /** 项目名称 */
  item_name: string
  /** 标准扣款金额 */
  deduction_amount?: number
  /** 是否必检 */
  is_required?: number
  /** 排序 */
  sort?: number
  /** 状态 */
  status?: number
  [key: string]: unknown
}

/** 质检分类 */
export interface InspectionCategory {
  /** 分类ID */
  id: number
  /** 分类名称 */
  category_name: string
  /** 分类标识 */
  category_key?: string
  /** 适用车辆类型ID */
  vehicle_type_id?: number
  /** 排序 */
  sort?: number
  /** 状态 */
  status?: number
  /** 子项目列表 */
  items?: InspectionItem[]
  [key: string]: unknown
}

// ==================== 质检队列统计 ====================

/** 质检统计 */
export interface QualityStats {
  /** 待查验数量 */
  pending: number
  /** 超时待检数量 */
  overdue: number
  /** 质检中数量 */
  in_progress: number
  /** 今日已完成 */
  today_completed: number
  /** 平均耗时(小时) */
  avg_hours: number
}

// ==================== 查询参数 ====================

/** 质检列表查询参数 */
export interface QualitySearchParams {
  keyword?: string
  order_id?: number
  plate_no?: string
  result?: QcResult | ''
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 质检队列查询参数 */
export interface QualityQueueParams {
  keyword?: string
  queue_status?: QueueStatus | ''
  page?: number
  limit?: number
  current?: number
  size?: number
}

// ==================== 创建/更新参数 ====================

/** 创建质检记录参数（步骤1） */
export interface QualityCreateParams {
  order_id: number
  vehicle_id: number
  /** 过磅重量 */
  weight: number | string
  /** 皮重 */
  tare_weight?: number | string
  /** 扣杂 */
  deduction_weight?: number | string
  /** 扣杂照片（逗号分隔 URL） */
  deduction_images?: string
  /** 整车照 */
  full_image?: string
  /** 车架号拓印照 */
  vin_rub_image?: string
  /** 车架号照 */
  vin_image?: string
  /** 发动机照 */
  engine_image?: string
  /** 其他照 */
  other_image?: string
  /** 车牌状态 */
  plate_status?: string
  /** 厂区类型 */
  factory_type?: string
  /** 监销标记 */
  is_supervision?: number
  /** 质检员ID */
  inspector_id?: number
  /** 质检员姓名 */
  inspector_name?: string
  /** 备注 */
  remark?: string
  /** 质检员签字 URL */
  inspector_signature?: string
  /** 拖车司机签字 URL */
  driver_signature?: string
  /** 车主/代理人签字 URL */
  owner_signature?: string
}

/** 更新质检项目参数 */
export interface QualityUpdateItemParams {
  /** 项目名称 */
  item_name: string
  /** 分类名 */
  item_category: string
  /** 状态: 1完好 2缺失 3损坏 */
  status: ItemStatus
  /** 损伤程度 */
  damage_level?: string
  /** 扣款金额 */
  deduction_amount?: number | string
  /** 扣款系数 */
  damage_coefficient?: number | string
  /** 备注 */
  remark?: string
  /** 照片JSON */
  images?: string
  /** 蓄电池数量（节） */
  battery_count?: number
  /** 轮胎轮毂材质：铁 / 铝 */
  tire_material?: string
}

/** 创建质检记录响应 */
export interface QualityCreateResult {
  /** 质检记录ID */
  id: number
  /** 报告编号 */
  check_no?: string
}

/** 按车牌创建质检单响应 */
export interface QualityCreateByPlateResult {
  /** 质检记录ID */
  check_id?: number
  /** 质检记录ID（兼容） */
  id?: number
  /** 订单ID */
  order_id?: number
  /** 车辆ID */
  vehicle_id?: number
  /** 车牌号 */
  plate_no?: string
  /** 报告编号 */
  check_no?: string
  [key: string]: unknown
}

/** 更新质检记录参数 */
export interface QualityUpdateParams {
  id: number
  /** 关联订单ID（步骤3必填） */
  order_id?: number
  /** 关联车辆ID（步骤3必填） */
  vehicle_id?: number
  /** 质检结论：1合格 2不合格（步骤3触发完成，后端必填） */
  conclusion?: number
  /** 质检结论类型：1车况正常 2存在缺件 3需特殊处理 */
  conclusion_type?: ConclusionType
  /** 质检项目数组 */
  items?: QualityUpdateItemParams[]
  /** 备注 */
  remark?: string
  /** 步骤1入场字段 */
  weight?: number | string
  tare_weight?: number | string
  deduction_weight?: number | string
  deduction_images?: string
  full_image?: string
  vin_rub_image?: string
  vin_image?: string
  engine_image?: string
  other_image?: string
  plate_status?: string
  factory_type?: string
  is_supervision?: number
  inspector_id?: number
  inspector_name?: string
  inspector_signature?: string
  driver_signature?: string
  owner_signature?: string
  [key: string]: unknown
}

// ==================== 列表响应 ====================

/** 队列列表响应 */
export interface QualityQueueList {
  records: QualityQueueItem[]
  total: number
  current: number
  size: number
}

/** 报告列表响应 */
export interface QualityReportList {
  records: QualityReportItem[]
  total: number
  current: number
  size: number
}

// ==================== 批量审核 ====================

/** 批量审核参数 */
export interface QualityBatchAuditParams {
  check_ids: (number | string)[]
  approved: number
  remark?: string
}

// ==================== 状态配置 ====================

/** 队列状态配置 */
export interface QueueStatusConfig {
  status: QueueStatus
  label: string
  color: string
  bg: string
}

export const QUEUE_STATUS_CONFIG: Record<QueueStatus, QueueStatusConfig> = {
  pending: { status: 'pending', label: '待查验', color: '#FA8C16', bg: '#FFF7E6' },
  overdue: { status: 'overdue', label: '超时待检', color: '#FF4D4F', bg: '#FFF2F0' },
  in_progress: { status: 'in_progress', label: '质检中', color: '#1677ff', bg: '#e6f4ff' },
  completed: { status: 'completed', label: '已完成', color: '#52C41A', bg: '#F6FFED' }
}

/** 队列状态筛选项（对接接口 queue_status，空为全部） */
export const QUEUE_STATUS_FILTER_OPTIONS: { value: QueueStatus; label: string }[] = [
  { value: 'pending', label: '待查验' },
  { value: 'in_progress', label: '质检中' },
  { value: 'completed', label: '已完成' }
]

/** 质检结果配置（列表展示） */
export const QC_RESULT_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: '待查验', color: '#FA8C16', bg: '#FFF7E6' },
  1: { label: '合格', color: '#52C41A', bg: '#F6FFED' },
  2: { label: '不合格', color: '#FF4D4F', bg: '#FFF2F0' }
}

/** 质检结果筛选项（对接接口 result，空为全部） */
export const QC_RESULT_FILTER_OPTIONS: { value: 1 | 2; label: string }[] = [
  { value: 1, label: '合格' },
  { value: 2, label: '不合格' }
]

/** 质检结论配置 */
export const CONCLUSION_CONFIG: Record<number, { label: string; color: string }> = {
  0: { label: '未填写', color: '#8C8C8C' },
  1: { label: '车况正常', color: '#52C41A' },
  2: { label: '存在缺件', color: '#FA8C16' },
  3: { label: '需特殊处理', color: '#FF4D4F' }
}

/** 质检项目状态标签 */
export const QC_ITEM_STATUS_LABEL: Record<number, string> = {
  1: '完好',
  2: '缺失',
  3: '损坏'
}

/** Tab类型 */
export type QualityTab = 'queue' | 'reports'

/** Tab配置 */
export interface QualityTabConfig {
  tab: QualityTab
  label: string
  icon: string
}

export const QUALITY_TAB_CONFIG: QualityTabConfig[] = [
  { tab: 'queue', label: '质检队列', icon: 'ri:clipboard-line' },
  { tab: 'reports', label: '质检报告', icon: 'ri:file-text-line' }
]

/** 质检步骤 */
export type QcStep = 0 | 1 | 2
export const QC_STEP_LABELS = ['入场信息', '质检查验', '质检报告']

/** 轮胎轮毂材质选项（铁 / 铝） */
export const WHEEL_MATERIAL_OPTIONS = ['铁', '铝'] as const

/** 监销类型选项 */
export const SUPERVISION_OPTIONS = [
  { label: '非监销', value: 0 },
  { label: '监销车辆', value: 1 }
]

/** 车牌状态选项 */
export const PLATE_STATUS_OPTIONS = ['无前牌', '无后牌']

/** 三方签名角色 */
export type QcSignatureRole = 'inspector_signature' | 'driver_signature' | 'owner_signature'

/** 三方签名配置 */
export const QC_SIGNATURE_CONFIG: Array<{ field: QcSignatureRole; label: string }> = [
  { field: 'inspector_signature', label: '质检员签字' },
  { field: 'driver_signature', label: '拖车司机签字' },
  { field: 'owner_signature', label: '车主/代理人签字' }
]

/** 是否为轮胎轮毂分类（该分类下各项才展示铁/铝） */
export function isTireHubCategory(categoryName: string): boolean {
  return categoryName === '轮胎轮毂'
}

/** @deprecated 使用 isTireHubCategory(category_name) */
export function isTireItem(itemName: string): boolean {
  return /左前|右前|左后|右后/.test(itemName)
}

/** 是否为蓄电池项 */
export function isBatteryItem(itemName: string): boolean {
  return itemName.includes('蓄电池')
}

/** 质检分类颜色映射（对齐原型） */
export const QC_CATEGORY_COLORS: Record<string, string> = {
  外观件: '#1890FF',
  内饰件: '#722ED1',
  发动机系统: '#FA8C16',
  底盘系统: '#13C2C2',
  电气系统: '#EB2F96',
  轮胎轮毂: '#52C41A'
}

/** 质检分类背景色（对齐原型） */
export const QC_CATEGORY_BG: Record<string, string> = {
  外观件: '#E6F7FF',
  内饰件: '#F9F0FF',
  发动机系统: '#FFF7E6',
  底盘系统: '#E6FFFB',
  电气系统: '#FFF0F6',
  轮胎轮毂: '#F6FFED'
}

/** 质检分类图标（对齐原型） */
export const QC_CATEGORY_ICONS: Record<string, string> = {
  外观件: 'ri:car-line',
  内饰件: 'ri:stack-line',
  发动机系统: 'ri:settings-3-line',
  底盘系统: 'ri:car-line',
  电气系统: 'ri:flashlight-line',
  轮胎轮毂: 'ri:record-circle-line'
}

/** 质检项目状态展示配置 */
export const QC_ITEM_STATUS_CFG: Record<
  ItemStatus,
  { label: string; short: string; color: string; bg: string }
> = {
  1: { label: '完好', short: '完', color: '#52C41A', bg: '#F6FFED' },
  2: { label: '缺失', short: '缺', color: '#FF4D4F', bg: '#FFF1F0' },
  3: { label: '损坏', short: '损', color: '#FA8C16', bg: '#FFF7E6' }
}

/** 入场照片字段（对齐后端 5 类） */
export type QcEntryPhotoField =
  'full_image' | 'vin_rub_image' | 'vin_image' | 'engine_image' | 'other_image'

/** 入场照片配置（对齐后端字段） */
export const QC_ENTRY_PHOTO_CONFIG: Array<{ label: string; field: QcEntryPhotoField }> = [
  { label: '整车照', field: 'full_image' },
  { label: '车架号拓印照', field: 'vin_rub_image' },
  { label: '车架号照', field: 'vin_image' },
  { label: '发动机照', field: 'engine_image' },
  { label: '其他照', field: 'other_image' }
]

/** @deprecated 使用 QC_ENTRY_PHOTO_CONFIG */
export const QC_ENTRY_PHOTO_TYPES = QC_ENTRY_PHOTO_CONFIG.map((item) => item.label)

/** 创建空入场照片对象 */
export function createEmptyEntryPhotos(): Record<QcEntryPhotoField, string> {
  return {
    full_image: '',
    vin_rub_image: '',
    vin_image: '',
    engine_image: '',
    other_image: ''
  }
}

/** 质检结论选项（对齐原型 Step3） */
export const QC_CONCLUSION_OPTIONS = [
  { value: 1 as ConclusionType, label: '车况正常', color: '#52C41A' },
  { value: 2 as ConclusionType, label: '存在缺件', color: '#FA8C16' },
  { value: 3 as ConclusionType, label: '需特殊处理', color: '#FF4D4F' }
]
