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
  | 'qc-summary'
  | 'vehicle-summary'
  | 'dismantle-output'
  | 'dismantle-detail'
  | 'dismantle-photos'
  | 'finance-settlement'
  | 'settlement-summary'
  | 'salesman-perf'
  | 'waste-stat'
  | 'raw-material-inout'
  | 'raw-material'

/** 质检汇总表 — 列表行 */
export interface QualityInspectionItem {
  /** 车辆 ID */
  id: number
  /** 车辆档案号 */
  vehicle_no: string
  /** 收车日期 */
  collect_date: string
  /** 自编号 */
  self_no: string
  /** 车牌号 */
  plate_no: string
  /** 质检状态码 */
  qc_status: string
  /** 质检状态文案 */
  qc_status_text: string
  /** 车主类型 personal/corporate */
  owner_type: string
  /** 排放标准 */
  emission_standard: string
  /** 车型 */
  vehicle_type_text: string
  /** 号牌状态 */
  plate_status: string
  /** 车主姓名 */
  owner_name: string
  /** 业务员 */
  business_name: string
  /** 代理人 */
  agent_name: string
  /** 运输方式 tow/self */
  delivery_type: string
  /** 拖车驾驶员/车牌 */
  driver_name: string
  /** 驱动类型 */
  fuel_type_text: string
  /** 磅重 kg */
  weight: number
  /** 电瓶状态 */
  battery_status: string
  /** 三元催化状态 */
  catalyst_status: string
  /** 缺件扣款 */
  deduction: number
  /** 质检单号 */
  check_no: string
  /** 质检员 */
  inspector_name: string
}

/** 质检汇总表 — 统计 */
export interface QualityInspectionStats {
  /** 质检总数 */
  total: number
  /** 已完成 */
  completed: number
  /** 质检中 */
  in_progress: number
  /** 已质检·待补资料 */
  pending_materials: number
  /** 不合格 */
  failed: number
  /** 筛选结果磅重合计（kg，后端可选返回） */
  total_weight?: number
}

/** 质检汇总表 — 筛选项 */
export interface QualityInspectionFilterOptions {
  agents: string[]
  inspectors: string[]
}

/** 质检汇总表 — 请求参数 */
export interface QualityInspectionParams {
  keyword?: string
  start_date?: string
  end_date?: string
  agent_name?: string
  inspector_name?: string
  qc_status?: string
  emission_standard?: string
  fuel_type?: string
  owner_type?: string
  vehicle_category?: string
  page?: number
  limit?: number
}

/** 质检汇总表 — 返回结构 */
export interface QualityInspectionResult {
  list: QualityInspectionItem[]
  count: number
  stats: QualityInspectionStats
  filter_options: QualityInspectionFilterOptions
}

/** 原料出入库清单 — 列表行 */
export interface MaterialInOutItem {
  /** 入库日期 */
  date: string
  /** 厂内编号 */
  internal_no: string
  /** 分类码 commercial/moto/private */
  category: string
  /** 分类文案 */
  category_label: string
  /** 车型 */
  vehicle_model: string
  /** 车架号 */
  vin: string
  /** 牌照号码 */
  plate_no: string
  /** 驱动类型 */
  drive_type: string
  /** 重量/吨 */
  weight: string
  /** 车辆产权人 */
  owner: string
  /** 入库单号 */
  entry_no: string
  /** 业务员 */
  salesman: string
  /** 代理人 */
  agent: string
  /** 领料人 */
  receiver: string
  /** 监销/非监销 */
  supervision: string
  /** 领料日期 */
  material_date: string
  /** 领证日期 */
  cert_date: string
  /** 备注 */
  remark: string
}

/** 原料出入库清单 — 统计 */
export interface MaterialInOutStats {
  /** 商用车数量 */
  commercial: number
  /** 商用车重量/吨 */
  commercialWeight: string
  /** 轻摩数量 */
  moto: number
  /** 轻摩重量/吨 */
  motoWeight: string
  /** 私家车数量 */
  private: number
  /** 私家车重量/吨 */
  privateWeight: string
}

/** 原料出入库清单 — 请求参数 */
export interface MaterialInOutParams {
  plate_no?: string
  internal_no?: string
  vin?: string
  owner?: string
  entry_no?: string
  business?: string
  vehicle_category?: string
  vehicle_model?: string
  drive_type?: string
  supervision?: string
  start_date?: string
  end_date?: string
  material_start_date?: string
  material_end_date?: string
  page?: number
  limit?: number
}

/** 原料出入库清单 — 返回结构 */
export interface MaterialInOutResult {
  list: MaterialInOutItem[]
  count: number
  stats: MaterialInOutStats
}

/** 原料日报表 — 列表行 */
export interface MaterialDailyItem {
  /** 车型名称 */
  name: string
  /** 规格 */
  spec: string
  /** 原料初期库数-重量/吨 */
  init_weight: string
  /** 原料初期库数-数量 */
  init_count: string | number
  /** 本日入库量-重量/吨 */
  today_in_weight: string
  /** 本日入库量-数量 */
  today_in_count: string | number
  /** 本日出库数-重量/吨 */
  today_out_weight: string
  /** 本日出库数-数量 */
  today_out_count: string | number
  /** 本月入库量-重量/吨 */
  month_in_weight: string
  /** 本月入库量-数量 */
  month_in_count: string | number
  /** 本月出库累计-重量/吨 */
  month_out_weight: string
  /** 本月出库累计-数量 */
  month_out_count: string | number
  /** 本日结存-重量/吨 */
  stock_weight: string
  /** 本日结存-数量 */
  stock_count: string | number
}

/** 原料日报表 — 统计卡片（后端 camelCase 原样） */
export interface MaterialDailyStats {
  initCount: number
  initWeight: string
  todayInCount: number
  todayInWeight: string
  todayOutCount: number
  todayOutWeight: string
  monthInCount: number
  monthInWeight: string
  monthOutCount: number
  monthOutWeight: string
  stockCount: number
  stockWeight: string
}

/** 原料日报表 — 请求参数 */
export interface MaterialDailyParams {
  keyword?: string
  vehicle_category?: string
  start_date?: string
  end_date?: string
  time_mode?: 'day' | 'week' | 'month'
  page?: number
  limit?: number
}

/** 原料日报表 — 返回结构 */
export interface MaterialDailyResult {
  list: MaterialDailyItem[]
  count: number
  stats: MaterialDailyStats
}

/** 报废车拆解报表 — 车辆行 */
export interface DismantleVehicleItem {
  /** 车型名称 */
  name: string
  /** 前期在制品-数量 */
  prev_wip_count: string | number
  /** 前期在制品-重量/吨 */
  prev_wip_weight: string
  /** 本日领料-数量 */
  today_receive_count: string | number
  /** 本日领料-重量/吨 */
  today_receive_weight: string
  /** 本月累计领料-数量 */
  month_receive_count: string | number
  /** 本月累计领料-重量/吨 */
  month_receive_weight: string
  /** 本日拆解-数量 */
  today_dismantle_count: string | number
  /** 本日拆解-重量/吨 */
  today_dismantle_weight: string
  /** 本月累计拆解-数量 */
  month_dismantle_count: string | number
  /** 本月累计拆解-重量/吨 */
  month_dismantle_weight: string
  /** 本日累计在制品-数量 */
  today_wip_count: string | number
  /** 本日累计在制品-重量/吨 */
  today_wip_weight: string
}

/** 报废车拆解报表 — 产物缴库行 */
export interface DismantleStorageItem {
  /** 类别 */
  category: string
  /** 产物名称 */
  product_name: string
  /** 本日缴库-数量 */
  today_storage_count: string | number
  /** 本日缴库-重量/吨 */
  today_storage_weight: string
  /** 本月累计缴库-数量 */
  month_storage_count: string | number
  /** 本月累计缴库-重量/吨 */
  month_storage_weight: string
}

/** 报废车拆解报表 — 统计 */
export interface DismantleStats {
  /** 本月累计领料数量 */
  month_received_count: number
  /** 本月累计领料重量 */
  month_received_weight: string
  /** 本月累计拆解数量 */
  month_dismantle_count: number
  /** 本月累计拆解重量 */
  month_dismantle_weight: string
  /** 当日拆解数量 */
  today_dismantle_count: number
  /** 当日拆解重量 */
  today_dismantle_weight: string
  /** 前期在制品数量 */
  prev_wip_count: number
  /** 前期在制品重量 */
  prev_wip_weight: string
}

/** 报废车拆解报表 — 请求参数 */
export interface DismantleParams {
  keyword?: string
  vehicle_category?: string
  start_date?: string
  end_date?: string
  time_mode?: 'day' | 'week' | 'month'
  page?: number
  limit?: number
}

/** 报废车拆解报表 — 返回结构 */
export interface DismantleResult {
  vehicle_list: DismantleVehicleItem[]
  storage_list: DismantleStorageItem[]
  product_categories: Record<string, string[]>
  stats: DismantleStats
}

/** 照片清单列字段 */
export type PhotoChecklistField =
  | 'photo_frame1'
  | 'photo_frame2'
  | 'photo_engine'
  | 'photo_transmission'
  | 'photo_steering'
  | 'photo_front_axle'
  | 'photo_rear_axle'
  | 'photo_stamp'
  | 'photo_battery'

/** 机动车报废拆解清单 — 列表行 */
export interface PhotoChecklistItem {
  /** 工单 ID */
  work_id: number
  /** 车牌号 */
  plate_no: string
  /** 工位负责人 */
  workstation?: string
  /** 拆解日期 */
  dismantle_date: string
  /** 掀顶/断粱时间 */
  roof_cut_time: string
  /** 五大总成拆解时间 */
  assembly_dismantle_time: string
  /** 已上传数量 */
  uploaded: number
  /** 应传总数 */
  total: number
  photo_frame1?: string | null
  photo_frame2?: string | null
  photo_engine?: string | null
  photo_transmission?: string | null
  photo_steering?: string | null
  photo_front_axle?: string | null
  photo_rear_axle?: string | null
  photo_stamp?: string | null
  photo_battery?: string | null
}

/** 照片清单统计（后端 camelCase 原样） */
export interface PhotoChecklistStats {
  verifiedCount: number
  totalPhotos: number
  completionRate: number
  pendingCount: number
}

/** 照片清单合计摘要 */
export interface PhotoChecklistSummary {
  uploaded: number
  total: number
  total_rows: number
  photo_frame1?: number
  photo_frame2?: number
  photo_engine?: number
  photo_transmission?: number
  photo_steering?: number
  photo_front_axle?: number
  photo_rear_axle?: number
  photo_stamp?: number
  photo_battery?: number
}

/** 照片清单 — 请求参数 */
export interface PhotoChecklistParams {
  plate_no?: string
  start_date?: string
  end_date?: string
  time_mode?: 'day' | 'week' | 'month'
  page?: number
  limit?: number
}

/** 照片清单 — 返回结构 */
export interface PhotoChecklistResult {
  list: PhotoChecklistItem[]
  count: number
  stats: PhotoChecklistStats
  summary: PhotoChecklistSummary
}

/** 财务结算申请表 — 列表行（接口现有字段 + 预留金额列） */
export interface FinancialSettlementItem {
  /** 结算单号 */
  settlement_no: string
  /** 车辆类型文案 */
  vehicle_type_text: string
  /** 车辆承类 */
  vehicle_class: string
  /** 自主录入日期 */
  entry_date: string
  /** 入库日期 */
  warehouse_date: string
  /** 入库单号 */
  warehouse_no: string
  /** 车辆产权人 */
  owner_name: string
  /** 身份证/机构代码 */
  owner_id_number: string
  /** 车主户口 */
  owner_address: string
  /** 车主银行卡号 */
  owner_bank_card: string
  /** 车辆档案单号 */
  archive_no: string
  /** 回收订单号 */
  order_no: string
  /** 代理人 */
  agent_name: string
  /** 代理人身份证 */
  agent_id_number: string
  /** 代理人手机号 */
  agent_phone: string
  /** 联系电话 */
  agent_contact: string
  /** 代理人户口 */
  agent_address: string
  /** 代理人银行卡号 */
  agent_bank_card: string
  /** 车牌号 */
  plate_no: string
  /** 车架号 */
  vin: string
  /** 自编号（预留） */
  vehicle_no?: string
  /** 我司车型（预留） */
  my_vehicle_model?: string
  /** 发动机号（预留） */
  engine_no?: string
  /** 品牌型号（预留） */
  brand?: string
  /** 车辆类型（预留） */
  vehicle_type?: string
  /** 车辆数（预留） */
  vehicle_count?: number | string
  /** 重量吨（预留） */
  weight?: number | string
  /** 磅差位置（预留） */
  scale_diff?: string
  /** 实际磅位（预留） */
  actual_scale?: number | string
  /** 拖车补贴元/吨（预留） */
  transport_subsidy?: number | string
  /** 拖车补贴金额（预留） */
  transport_subsidy_amt?: number | string
  /** 运费类目（预留） */
  freight_category?: string
  /** 道路运费元/吨（预留） */
  freight_per_ton?: number | string
  /** 结算类目（预留） */
  settlement_category?: string
  /** 结算价格元/吨（预留） */
  settlement_price?: number | string
  /** 竞价合同（预留） */
  bidding_contract?: string
  /** 合同金额（预留） */
  contract_amt?: number | string
  /** 应付金额（预留） */
  payable_amt?: number | string
  /** 现金支付金额（预留） */
  cash_pay_amt?: number | string
  /** 服务费类目（预留） */
  service_fee_category?: string
  /** 服务费元/吨（预留） */
  service_fee_per_ton?: number | string
  /** 服务费合计（预留） */
  service_fee_total?: number | string
  /** 正规费合计（预留） */
  regular_fee_total?: number | string
  /** 本年总金额（预留） */
  year_total_amt?: number | string
  /** 合计（预留） */
  grand_total?: number | string
  /** 备注（预留） */
  remark?: string
  /** 其他费用（预留） */
  other_fee?: number | string
  /** 分公司（预留） */
  branch_office?: string
}

/** 财务结算申请表 — 统计（后端 camelCase 原样） */
export interface FinancialSettlementStats {
  settlementCount: number
  totalAmount: string
  serviceFee: string
  yearTotalAmount: string
}

/** 财务结算申请表 — 请求参数 */
export interface FinancialSettlementParams {
  plate_no?: string
  vin?: string
  vehicle_no?: string
  my_vehicle_model?: string
  owner?: string
  agent_name?: string
  agent_phone?: string
  warehouse_no?: string
  archive_no?: string
  order_no?: string
  vehicle_category?: string
  remark?: string
  entry_start_date?: string
  entry_end_date?: string
  archive_start_date?: string
  archive_end_date?: string
  order_start_date?: string
  order_end_date?: string
  time_mode?: 'day' | 'week' | 'month'
  page?: number
  limit?: number
}

/** 财务结算申请表 — 返回结构 */
export interface FinancialSettlementResult {
  list: FinancialSettlementItem[]
  count: number
  stats: FinancialSettlementStats
}

/** 趋势分析 — 请求参数 */
export interface ReportTrendParams {
  /** 时间粒度：day / week / month */
  time_granularity?: 'day' | 'week' | 'month'
  /** 开始日期 yyyy-MM-dd */
  start_date?: string
  /** 结束日期 yyyy-MM-dd */
  end_date?: string
}

/** 趋势分析 — 预警项 */
export interface ReportTrendWarning {
  /** 预警级别：warning / danger */
  type: 'warning' | 'danger'
  /** 预警标题 */
  label: string
  /** 预警描述 */
  desc: string
}

/** 趋势分析 — 返回结构 */
export interface ReportTrendResult {
  /** 横轴标签 */
  labels: string[]
  /** 收车量趋势（辆） */
  vehicle_data: number[]
  /** 结算金额趋势（万元） */
  settlement_data: number[]
  /** 产物入库趋势（吨） */
  product_data: number[]
  /** 预警指标 */
  warnings: ReportTrendWarning[]
}
