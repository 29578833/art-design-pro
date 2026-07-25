/** 收车汇总月度行 */
export interface ScrapSummaryMonthItem {
  month: string
  count: number
  personal: number
  enterprise: number
  avg_price: number
  total_amount: string
  yoy: number
}

/** 收车汇总报表 */
export interface ScrapSummaryResult {
  current_count: number
  yoy: number
  avg_price: number
  total_amount: string
  monthly: ScrapSummaryMonthItem[]
}

/** 业务员绩效行 */
export interface SalesPerformanceItem {
  uid: number
  name: string
  count: number
  amount: number
  avg_price: number
  rate: number
}

/** 业务员绩效报表 */
export interface SalesPerformanceResult {
  list: SalesPerformanceItem[]
  chart: {
    names: string[]
    counts: number[]
  }
}

/** 报表日期筛选 */
export interface ReportDateParams {
  start_date?: string
  end_date?: string
}

/** 数据决策看板统计（趋势分析用） */
export interface DecisionStatistics {
  purchase_trend?: number[]
  settlement_trend_data?: number[]
  overdue_count?: number
  pending_settlement_count?: number
  pending_settlement_amount?: number | string
  warehouse_count?: number
  [key: string]: unknown
}

/** 车辆档案信息汇总表 — 进度步骤 */
export interface VehicleArchiveProgress {
  /** 信息录入日期 (mm-dd) */
  info_entry: string
  /** 查验入库日期 (mm-dd) */
  inspect_warehousing: string
  /** 拆解日期 (mm-dd) */
  dismantle: string
  /** 送审日期 (mm-dd) */
  submit_review: string
  /** 办证日期 (mm-dd) */
  certificate: string
  /** 领证日期 (mm-dd) */
  get_certificate: string
  /** 请款日期 (mm-dd) */
  payment_request: string
}

/** 车辆档案信息汇总表 — 汽车行 */
export interface VehicleArchiveCarItem {
  /** 自编号 */
  self_no: string
  /** 进车/入库日期 */
  entry_date: string
  /** 业务员 */
  salesman: string
  /** 代理人 */
  agent: string
  /** 电话号码 */
  phone: string
  /** 车辆产权人 */
  owner: string
  /** 车型 */
  vehicle_type: string
  /** 品牌 */
  brand: string
  /** 号牌号码 */
  plate_no: string
  /** 车架号 */
  vin: string
  /** 发动机号 */
  engine_no: string
  /** 颜色 */
  color: string
  /** 类别：乘用车/商用车 */
  category: string
  /** 使用性质 */
  usage_nature: string
  /** 整备质量(吨) */
  curb_weight: string
  /** 实际重量(吨) */
  actual_weight: string
  /** 结算重量(吨) */
  settle_weight: string
  /** 监销/非监销 */
  supervision: string
  /** 正常/非正常 */
  abnormal: string
  /** 运输方式 */
  transport: string
  /** 7 步进度日期 */
  progress: VehicleArchiveProgress
  /** 备注 */
  remark: string
}

/** 车辆档案信息汇总表 — 摩托车行 */
export interface VehicleArchiveMotoItem {
  /** 自编号 */
  self_no: string
  /** 入库日期 */
  entry_date: string
  /** 车辆产权人 */
  owner: string
  /** 业务员 */
  salesman: string
  /** 代理人 */
  agent: string
  /** 电话号码 */
  phone: string
  /** 号牌号码 */
  plate_no: string
  /** 整备质量(吨) */
  curb_weight: string
  /** 中心结算吨位 */
  settle_weight: string
  /** 实际吨位 */
  actual_weight: string
  /** 品牌 */
  brand: string
  /** 车型 */
  vehicle_type: string
  /** 使用性质 */
  usage_nature: string
  /** 颜色 */
  color: string
  /** 车架号 */
  vin: string
  /** 发动机号 */
  engine_no: string
  /** 区域 */
  area: string
  /** 报送材料日期 */
  material_date: string
  /** 办证完成日期 */
  cert_date: string
  /** 备注 */
  remark: string
}

/** 车辆档案信息汇总表请求参数 */
export interface VehicleArchiveParams {
  /** 关键词（业务员/代理人/电话/车牌/车架号/产权人/自编号） */
  keyword?: string
  /** 开始日期 */
  start_date?: string
  /** 结束日期 */
  end_date?: string
  /** 车型：car/moto */
  type?: 'car' | 'moto'
  /** 进度步骤筛选 */
  progress_status?: string
  /** 页码 */
  page?: number
  /** 每页条数 */
  limit?: number
}

/** 车辆档案信息汇总表返回结构 */
export interface VehicleArchiveResult {
  /** 数据列表 */
  list: VehicleArchiveCarItem[] | VehicleArchiveMotoItem[]
  /** 总条数 */
  count: number
  /** 各 Tab 数量统计 */
  tabs: {
    car: number
    moto: number
  }
}

/** 报表卡片 key */
export type ReportKey =
  | 'vehicle-archive-summary'
  | 'vehicle-summary'
  | 'dismantle-output'
  | 'settlement-summary'
  | 'salesman-perf'
  | 'waste-stat'
