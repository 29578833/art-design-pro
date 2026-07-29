// ==================== 拆解管理 ====================

/** 工单状态：0待拆解 1已完成 */
export type PlateStatus = 0 | 1

/** 车辆类型：1汽油 2纯电动 3插电混动 */
export type PlateVehicleType = 1 | 2 | 3

/** 列表筛选：pending/completed 对应后端 status 字符串 */
export type PlateStatusFilter = '' | 'pending' | 'completed' | PlateStatus

/** 拆解工单列表项 */
export interface PlateItem {
  id: number
  archive_no?: string
  plate_no?: string
  vehicle_model?: string
  vehicle_type?: PlateVehicleType
  vehicle_type_text?: string
  owner_name?: string
  owner_phone?: string
  is_normal_weigh?: number
  net_weight?: number | string
  unit?: string
  parking_spot?: string
  priority?: string
  status: PlateStatus
  status_text?: string
  preprocess_status?: string
  preprocess_status_text?: string
  progress?: number
  person_in_charge?: string
  person_in_charge_id?: number
  order_id?: number
  remark?: string
  qc_result?: string
  preprocess_items?: string | PreprocessCheckedItem[]
  preprocess_finish_time?: string
  add_time?: number
  add_time_text?: string
  [key: string]: unknown
}

/** 列表查询参数 */
export interface PlateSearchParams {
  keyword?: string
  status?: PlateStatusFilter
  priority?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 拆解统计 */
export interface PlateStats {
  pending: number
  preprocess_done: number
  completed: number
  monthly: number
}

/** 新建拆解工单参数 */
export interface PlateCreateParams {
  vehicle_id?: number
  archive_no?: string
  order_id?: number
  plate_no?: string
  vehicle_model?: string
  vehicle_type?: PlateVehicleType
  owner_name?: string
  owner_phone?: string
  is_normal_weigh?: number
  net_weight?: number
  unit?: string
  parking_spot?: string
  priority?: string
  status?: PlateStatus
  progress?: number
  person_in_charge?: string
  person_in_charge_id?: number
  remark?: string
}

/** 待创建拆解工单的车辆（pending_vehicles 接口） */
export interface PlatePendingVehicle {
  /** 车辆ID */
  id: number
  /** 车牌号 */
  plate_no?: string
  /** 品牌 */
  brand?: string
  /** 车型 */
  model?: string
  /** 车主姓名 */
  owner_name?: string
  /** 库位 */
  warehouse_slot?: string
  /** 燃料类型 */
  fuel_type?: string
  /** 车型描述（brand + model） */
  vehicle_model?: string
  /** 车辆类型：1汽油 2纯电动 3插电混动 */
  vehicle_type?: PlateVehicleType
  [key: string]: unknown
}

/** 预处理步骤（接口返回） */
export interface PreprocessStepOption {
  id: number
  step_key: string
  step_name: string
  sort?: number
  is_enabled?: number
}

/** 预处理勾选项 */
export interface PreprocessCheckedItem {
  step_key: string
  finish_time?: string
}

/** 预处理提交参数 */
export interface PreprocessSaveParams {
  plate_id: number
  checked_items: PreprocessCheckedItem[]
  finish_time?: string
}

/** 拆解时间登记 */
export interface DismantleTimeForm {
  dismantle_date?: string
  roof_cut_time?: string
  assembly_dismantle_time?: string
}

/** 拆解照片字段（与接口 photo_xxx 一致） */
export type DismantlePhotoField =
  | 'photo_frame1'
  | 'photo_frame2'
  | 'photo_engine'
  | 'photo_transmission'
  | 'photo_steering'
  | 'photo_front_axle'
  | 'photo_rear_axle'
  | 'photo_stamp'
  | 'photo_battery'

/** 拆解照片项 */
export interface DismantlePhotoItem {
  field: DismantlePhotoField
  name: string
  url?: string
}

/** init 接口 photos 字段映射 */
export type DismantlePhotosMap = Partial<Record<DismantlePhotoField, string>>

/** 预处理步骤（旧拆解 init 兼容） */
export interface DismantlePreprocessStep {
  key: string
  name: string
  sort?: number
  done?: boolean
}

/** 工位记录 */
export interface DismantleStation {
  id?: number
  station_key?: string
  station_name?: string
  station_desc?: string
  worker_id?: number
  worker_name?: string
  status?: number
  sort?: number
}

/** 总成记录 */
export interface DismantleAssembly {
  id?: number
  assembly_key?: string
  assembly_name?: string
  part_status?: string
  part_no?: string
  weight?: number
  remark?: string
  photos?: string | string[]
}

/** 拆解初始化数据 */
export interface DismantleInitData {
  plate_id: number
  archive_no?: string
  plate_no?: string
  vehicle_model?: string
  vehicle_type?: PlateVehicleType
  vehicle_type_text?: string
  net_weight?: number
  unit?: string
  parking_spot?: string
  order_id?: number
  person_in_charge?: string
  person_in_charge_id?: number
  overall_progress?: number
  work_status?: number
  work_id?: number
  fuel_type?: string
  create_time?: string
  dismantle_date?: string
  roof_cut_time?: string
  assembly_dismantle_time?: string
  photos?: DismantlePhotosMap
  preprocess_steps?: DismantlePreprocessStep[]
  preprocess_data?: string[]
  stations?: DismantleStation[]
  assemblies?: DismantleAssembly[]
  admin_list?: { id: number; real_name: string }[]
}

/** 拆解保存参数 */
export type DismantleSaveParams = {
  dismantle_time?: DismantleTimeForm
  work_status?: number
  preprocess_steps?: DismantlePreprocessStep[]
  stations?: DismantleStation[]
  assemblies?: DismantleAssembly[]
} & Partial<Record<DismantlePhotoField, string>>

/** 拆解操作日志项 */
export interface DismantleLogItem {
  id?: number
  action?: string
  content?: string
  operator_name?: string
  add_time?: number
  add_time_text?: string
}

/** 拆解日志响应 */
export interface DismantleLogResult {
  logs: DismantleLogItem[]
  work_id: number
}

/** 工单状态标签配置 */
export const PLATE_STATUS_CONFIG: Record<
  PlateStatus,
  { label: string; color: string; bg: string }
> = {
  0: { label: '待拆解', color: '#FA8C16', bg: '#FFF7E6' },
  1: { label: '已完成', color: '#52C41A', bg: '#F6FFED' }
}

/** 预处理状态标签配置 */
export const PLATE_PREPROCESS_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: '待处理', color: '#FA8C16', bg: '#FFF7E6' },
  completed: { label: '已完成', color: '#52C41A', bg: '#F6FFED' }
}

/** 车辆类型标签配置 */
export const PLATE_VEHICLE_TYPE_CONFIG: Record<PlateVehicleType, { color: string; bg: string }> = {
  1: { color: '#1677ff', bg: '#E6F7FF' },
  2: { color: '#722ED1', bg: '#F9F0FF' },
  3: { color: '#722ED1', bg: '#F9F0FF' }
}

/** 列表状态筛选（原型：全部 / 待拆解 / 已完成） */
export const PLATE_STATUS_FILTER_TABS: { label: string; value: PlateStatusFilter }[] = [
  { label: '全部状态', value: '' },
  { label: '待拆解', value: 'pending' },
  { label: '已完成', value: 'completed' }
]

/** 拆解照片模板（与接口字段一致） */
export const DISMANTLE_PHOTO_FIELDS: { field: DismantlePhotoField; name: string }[] = [
  { field: 'photo_frame1', name: '车架照' },
  { field: 'photo_frame2', name: '车架照2' },
  { field: 'photo_engine', name: '发动机照' },
  { field: 'photo_transmission', name: '变速器照' },
  { field: 'photo_steering', name: '方向器照' },
  { field: 'photo_front_axle', name: '前桥照' },
  { field: 'photo_rear_axle', name: '后桥照' },
  { field: 'photo_stamp', name: '钢印部位照' },
  { field: 'photo_battery', name: '动力电池照片' }
]

/** @deprecated 使用 DISMANTLE_PHOTO_FIELDS */
export const MINISTRY_DISMANTLE_PHOTOS = DISMANTLE_PHOTO_FIELDS.map((item) => ({
  id: item.field,
  name: item.name,
  code: item.field
}))
