// ==================== 库位管理（仓库区域 + 已入库车辆） ====================

/** 仓库区域概览项（area_overview 接口字段） */
export interface WarehouseAreaOverviewItem {
  id: number
  name?: string
  tag?: string
  total?: number
  occupied?: number
  location_count?: number
  remark?: string
  /** 1启用 0禁用 */
  status?: number
  sort?: number
  [key: string]: unknown
}

/** 仓库区域查询 */
export interface WarehouseAreaSearchParams {
  keyword?: string
  status?: number | ''
}

/** 新增/编辑仓库区域 */
export interface WarehouseAreaSaveParams {
  name: string
  tag?: string
  total?: number
  remark?: string
}

/** 库位统计 */
export interface WarehouseLocationStats {
  area_count: number
  inbound_count: number
  today_entry: number
  weigh_done: number
  entry_done: number
  pending: number
}

/** 已入库车辆 */
export interface WarehouseInboundVehicle {
  id: number
  archive_no?: string
  plate_no?: string
  vin?: string
  brand?: string
  model?: string
  owner_name?: string
  warehouse_name?: string
  warehouse_slot?: string
  order_no?: string
  entry_no?: string
  entry_time?: string
  inspector_name?: string
  [key: string]: unknown
}

/** 已入库车辆查询 */
export interface WarehouseInboundVehicleSearchParams {
  keyword?: string
  vin?: string
  order_no?: string
  warehouse_name?: string
  page?: number
  limit?: number
  current?: number
  size?: number
}
