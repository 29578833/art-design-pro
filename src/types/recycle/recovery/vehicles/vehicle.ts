/** 车辆档案列表 Tab */
export type VehicleTab = 'all' | 'transport' | 'factory' | 'cancellation' | 'completed'

/** 三维状态单项 */
export interface VehicleDimStatusItem {
  /** 状态文案 */
  label: string
  /** 文字色 */
  color: string
  /** 背景色 */
  bg: string
  /** 图标 */
  icon?: string
}

/** 三维并行状态 */
export interface VehicleDimStatus {
  /** 拖车维度 */
  tow: VehicleDimStatusItem
  /** 入厂拆解维度 */
  factory: VehicleDimStatusItem
  /** 注销办证维度 */
  cancel: VehicleDimStatusItem
}

/** 车辆档案列表项（直接使用接口字段） */
export interface ScrapVehicle {
  /** 主键 ID */
  id: number
  /** 车辆档案号 */
  vehicle_no?: string
  /** 档案号（拖车列表可能用 archive_no） */
  archive_no?: string
  /** 关联订单 ID */
  order_id?: number
  /** 关联订单号 */
  order_no?: string
  /** 车牌号 */
  plate_no?: string
  /** 车架号 */
  vin?: string
  /** 品牌 */
  brand?: string
  /** 车型 */
  model?: string
  /** 品牌车型拼接 */
  brand_model?: string
  /** 车辆类型 */
  vehicle_type?: string
  /** 车辆类型文案 */
  vehicle_type_text?: string
  /** 燃料类型 */
  fuel_type?: string
  /** 燃料类型文案 */
  fuel_type_text?: string
  /** 状态码 */
  status: number
  /** 状态文案 */
  status_text?: string
  /** 三维状态 */
  dim_status?: VehicleDimStatus
  /** 车主姓名 */
  owner_name?: string
  /** 车主电话 */
  owner_phone?: string
  /** 车主展示文案 */
  owner_display?: string
  /** 所有人同步表 ID */
  owner_sync_id?: number
  /** 是否已提交商务部 */
  is_submitted_commerce?: number
  /** 创建时间文案 */
  add_time_text?: string
  /** 更新时间文案 */
  update_time_text?: string
  [key: string]: unknown
}

/** 车辆状态统计 */
export interface VehicleStatusCounts {
  /** 总量 */
  total: number
  /** 拖车阶段 */
  transport: number
  /** 入厂拆解 */
  factory: number
  /** 注销办证 */
  cancellation: number
  /** 已完结 */
  completed: number
  /** 各 status 计数 */
  status?: Record<number | string, number>
}

/** Tab 配置项 */
export interface VehicleTabConfigItem {
  tab: VehicleTab
  label: string
  icon: string
  /** 对应 list 的 status 参数 */
  status: string
  /** status_counts 字段名 */
  countKey: keyof VehicleStatusCounts
}

export const VEHICLE_TAB_CONFIG: VehicleTabConfigItem[] = [
  { tab: 'all', label: '全部', icon: 'ri:car-line', status: '', countKey: 'total' },
  {
    tab: 'transport',
    label: '拖车阶段',
    icon: 'ri:truck-line',
    status: '3',
    countKey: 'transport'
  },
  {
    tab: 'factory',
    label: '入厂拆解',
    icon: 'ri:building-2-line',
    status: '2,4',
    countKey: 'factory'
  },
  {
    tab: 'cancellation',
    label: '注销办证',
    icon: 'ri:file-list-3-line',
    status: '5',
    countKey: 'cancellation'
  },
  {
    tab: 'completed',
    label: '已完结',
    icon: 'ri:checkbox-circle-line',
    status: '6',
    countKey: 'completed'
  }
]

/** Tab 计数 */
export interface VehicleTabCount {
  tab: VehicleTab
  label: string
  count: number
}

/** 列表查询参数 */
export interface VehicleSearchParams {
  keyword?: string
  plate_no?: string
  vin?: string
  status?: string
  tab?: VehicleTab
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 列表响应（useTable 格式） */
export interface VehicleList {
  records: ScrapVehicle[]
  total: number
  current: number
  size: number
}

/** 状态变更日志 */
export interface VehicleStatusLog {
  title: string
  time: string
  operator_name?: string
  operator_type?: string
  from_status?: number
  to_status?: number
}

/** 流程步骤 */
export interface VehicleFlowStep {
  label: string
  desc?: string
  done?: boolean
  time?: string
  operator?: string
  note?: string
  key?: string
  color?: string
  bg?: string
}

/** 车辆详情（直接使用接口字段） */
export interface ScrapVehicleDetail extends ScrapVehicle {
  /** 发动机号 */
  engine_no?: string
  /** 颜色 */
  color?: string
  /** 注册日期 */
  reg_date?: string
  /** 里程 */
  mileage?: number | string
  /** 车主证件号 */
  owner_id_card?: string
  /** 车主地址 */
  owner_address?: string
  /** 所有人类型 */
  owner_type?: string
  /** 送货方式 */
  delivery_method?: string
  /** 送货方式文案 */
  delivery_method_text?: string
  /** 拖车取车地址 */
  tow_pickup_address?: string
  /** 拖车联系人 */
  tow_pickup_contact?: string
  /** 拖车电话 */
  tow_pickup_phone?: string
  /** 自送地址 */
  self_delivery_address?: string
  /** 自送联系人 */
  self_delivery_name?: string
  /** 自送电话 */
  self_delivery_phone?: string
  /** 结算类型 */
  settlement_type?: string
  /** 结算类型文案 */
  settlement_type_text?: string
  /** 结算方式 */
  settlement_method?: string
  /** 结算方式文案 */
  settlement_method_text?: string
  /** 结算金额 */
  settlement_amount?: number | string
  /** 开户名 */
  bank_name?: string
  /** 开户行 */
  bank_branch?: string
  /** 银行卡号 */
  bank_card_no?: string
  /** 备注 */
  remark?: string
  /** 是否有代理人 */
  has_agent?: number
  /** 代理人姓名 */
  agent_name?: string
  /** 代理人电话 */
  agent_phone?: string
  /** 库位名 */
  warehouse_name?: string
  /** 库位 */
  warehouse_slot?: string
  /** 照片 */
  photos?: Record<string, string>
  /** 图片 */
  images?: string[] | Record<string, unknown>
  /** 证件图片 */
  certificate_images?: string[] | Record<string, unknown>
  /** 关联附件 */
  attachments?: Array<Record<string, unknown>>
  /** 状态日志 */
  status_logs?: VehicleStatusLog[]
  /** 拖车进度 */
  tow_progress?: VehicleFlowStep[]
  /** 入厂拆解流程 */
  factory_flow?: VehicleFlowStep[]
  /** 注销办证流程 */
  cancel_flow?: VehicleFlowStep[]
  /** 操作日志 */
  operation_logs?: VehicleStatusLog[]
  /** 所有人类型 1=企业 2=个人 */
  syq?: number
  /** 关联拖车订单号 */
  tow_order_no?: string
  /** 线索单号 */
  lead_no?: string
  /** 关联线索订单号 */
  lead_order_no?: string
  /** 车主证件号（接口字段） */
  owner_id_number?: string
  /** 所有人证件图 */
  owner_id_front_image?: string
  owner_id_back_image?: string
  owner_license_image?: string
  owner_missing_image?: string
  /** 车辆证件图 */
  license_front_image?: string
  license_back_image?: string
  license_both_image?: string
  cert_image?: string
  owner_change_image?: string
  /** 代理人证件图 */
  agent_id_front_image?: string
  agent_id_back_image?: string
  agent_auth_image?: string
  agent_id_number?: string
  /** 拖车进场照 */
  photo_front?: string
  photo_side?: string
  photo_back?: string
  photo_interior?: string
  /** 行驶证/产证编号 */
  license_no?: string
  cert_no?: string
  vehicle_model?: string
  plate_type?: string
  fuel_nature?: string
  register_date?: string
  year?: string | number
  monitor_type?: string
  usage_type?: string
  displacement?: string | number
  power_kw?: string | number
  /** 自送费补贴 */
  self_delivery_subsidy?: string | number
  /** 创建人 */
  created_by?: string
  created_at?: string
}
