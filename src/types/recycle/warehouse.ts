// ==================== 原料入库（待入厂车辆） ====================

/** 原料入库列表项（直接使用接口字段） */
export interface WarehouseEntryItem {
  /** 车辆ID */
  vehicle_id: number
  /** 订单ID */
  order_id: number
  /** 订单号 */
  order_no?: string
  /** 车牌号 */
  plate_no?: string
  /** 品牌 */
  brand?: string
  /** 车型 */
  model?: string
  /** 品牌车型拼接（接口计算） */
  vehicle_info?: string
  /** 车辆类型 */
  vehicle_type?: string
  /** 燃料类型 */
  fuel_type?: string
  /** 颜色 */
  color?: string
  /** 车辆重量 */
  weight?: number
  /** 车主姓名 */
  owner_name?: string
  /** 客户姓名（接口计算，优先 owner_name） */
  customer_name?: string
  /** 客户电话（接口计算） */
  customer_phone?: string
  /** 订单联系电话 */
  owner_phone?: string
  /** 订单客户姓名 */
  order_real_name?: string
  /** 车辆来源 */
  vehicle_source?: string
  /** 仓库名称 */
  warehouse_name?: string
  /** 库位 */
  warehouse_slot?: string
  /** 车辆状态码（3=待入厂） */
  status: number
  /** 状态文案 */
  status_text?: string
  /** 到场时间（Unix 时间戳） */
  add_time?: number
  /** 质检员姓名 */
  inspector_name?: string
  /** 质检过磅重量 */
  qc_weight?: number
  /** 称重毛重 */
  gross_weight?: number
  /** 称重皮重 */
  weigh_tare?: number
  /** 称重毛重（接口字段 weigh_gross） */
  weigh_gross?: number
  /** 称重皮重 */
  tare_weight?: number
  /** 称重净重（接口字段 weigh_net） */
  weigh_net?: number
  /** 称重表净重 */
  net_weight?: number
  [key: string]: unknown
}

/** 原料入库列表查询参数 */
export interface WarehouseEntrySearchParams {
  /** 关键词：车牌/VIN/车主/品牌/车型/车辆编号 */
  keyword?: string
  /** 订单ID */
  order_id?: number | string
  /** 状态（后端列表固定查 status=3，一般无需传） */
  status?: string
  /** 当前页 */
  page?: number
  /** 每页条数 */
  limit?: number
  /** useTable 分页字段 */
  current?: number
  size?: number
}

/** 原料入库统计 */
export interface WarehouseEntryStats {
  /** 待入厂（待确认入库） */
  pending: number
  /** 今日已入库 */
  today: number
  /** 本月入库总量 */
  entered: number
}

/** 库位选项（location_list 接口字段） */
export interface WarehouseLocationOption {
  /** 库位ID */
  id: number
  /** 库位编号 */
  location_no?: string
  /** 区域名称 */
  area?: string
  /** 所属仓库区域ID */
  warehouse_area_id?: number
  /** 状态：0空闲 1已占用 */
  status?: number
  /** 状态文案 */
  status_text?: string
  /** 最大容量 */
  max_capacity?: number
  /** 备注 */
  remark?: string
  [key: string]: unknown
}

/** 仓库区域选项 */
export interface WarehouseAreaOption {
  /** 区域ID */
  id: number
  /** 区域名称 */
  area_name: string
}

/** 确认原料入库参数 */
export interface WarehouseEntryConfirmParams {
  /** 车辆ID */
  vehicle_id: number
  /** 库位（ID 或名称，后端自动解析） */
  location?: string
  /** 仓库区域名称 */
  warehouse_area?: string
  /** 仓库区域ID */
  warehouse_area_id?: number
  /** 库位编码 */
  location_code?: string
  /** 入厂照片（URL，多张逗号分隔） */
  images?: string
  /** 备注 */
  remark?: string
}

/** 确认入库返回 */
export interface WarehouseEntryConfirmResult {
  /** 入库记录ID */
  id: number
  /** 入库单号 */
  entry_no?: string
  [key: string]: unknown
}

/** 手动登记入库参数（entry_save） */
export interface WarehouseEntrySaveParams {
  /** 订单ID */
  order_id: number
  /** 车辆ID */
  vehicle_id: number
  /** 库位ID */
  location_id: number
  /** 车牌号 */
  plate_no?: string
  /** 车辆信息 */
  vehicle_info?: string
  /** 客户姓名 */
  customer_name?: string
  /** 客户电话 */
  customer_phone?: string
  /** 车辆重量 */
  vehicle_weight?: number
  /** 备注 */
  remark?: string
  /** 照片 */
  images?: string[] | string
}
