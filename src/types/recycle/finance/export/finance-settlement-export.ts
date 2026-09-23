// ==================== 结算车辆导出宽表 ====================

export type SettlementExportSettleStatus = '' | 'pending' | 'settled'

export interface SettlementExportColumnDef {
  /** 列表接口原字段 */
  key: string
  /** 导出接口 fields 字段 */
  exportKey: string
  label: string
  group: string
  width?: number
  /** 暂不展示、不导出 */
  hidden?: boolean
}

/** 结算车辆导出列表项（接口原字段，与 /scrap/settlement_vehicle_export/list 出参一致） */
export interface SettlementVehicleExportRow {
  /** 明细主键 ID */
  id: number
  /** 结算单 ID */
  settlement_id: number
  /** 车辆档案 ID */
  vehicle_id: number
  /** 订单 ID */
  order_id: number
  /** 自编号（车辆档案号） */
  vehicle_no: string
  /** 我司车型（结算明细表 model） */
  our_model: string
  /** 柴油/汽油（字典 car_rylx 翻译后的文案） */
  fuel_type: string
  /** 信息录入日期 Y-m-d H:i:s */
  add_time: string
  /** 入厂日期 Y-m-d */
  factory_date: string
  /** 入库日期 Y-m-d */
  entry_date: string
  /** 入库单号 */
  warehouse_no: string
  /** 运单日期（暂无数据来源，空串） */
  transport_date: string
  /** 运单编号（暂无数据来源，空串） */
  transport_no: string
  /** 自送/拖运 */
  delivery_type: string
  /** 车辆产权人 */
  owner_name: string
  /** 车辆产权人身份证/组织机构代码证 */
  owner_id_card: string
  /** 车主开户行 */
  owner_bank: string
  /** 车主银行卡号 */
  owner_card_no: string
  /** 代理人 */
  agent_name: string
  /** 代理人身份证（暂无数据来源，空串） */
  agent_id_card: string
  /** 联系电话（代理人手机号） */
  agent_phone: string
  /** 代理人开户行（暂无数据来源，空串） */
  agent_bank: string
  /** 代理人银行卡号（暂无数据来源，空串） */
  agent_card_no: string
  /** 车牌号 */
  plate_no: string
  /** 车架号 */
  vin: string
  /** 发动机号 */
  engine_no: string
  /** 品牌型号 */
  brand_model: string
  /** 车辆类型（字典 car_cllx_ga 翻译后的文案） */
  vehicle_type: string
  /** 车辆数 */
  sales_qty: number
  /** 整备质量(吨) */
  prepared_weight: string
  /** 中心结算吨位 */
  central_weight: string
  /** 实际吨位 */
  actual_weight: string
  /** 拖车单价含税（元）（暂无数据来源，空串） */
  tow_unit_price: string
  /** 拖车缺件扣款（暂无数据来源，空串） */
  tow_missing_deduction: string
  /** 拖车费金额不含税（元）（暂无数据来源，空串） */
  tow_fee_excl_tax: string
  /** 运费结算日期（暂无数据来源，空串） */
  freight_settle_date: string
  /** 自送费（元/辆） */
  self_delivery_fee: string
  /** 缺补件吨位 */
  missing_compensation_pos: string
  /** 残值单价（元） */
  residual_unit_price: string
  /** 缺件(元) */
  missing_parts: string
  /** 实际支付残值金额 */
  residual_amount: string
  /** 残值结算日期 */
  residual_settle_date: string
  /** 服务费（元/吨） */
  service_fee_unit_price: string
  /** 服务费合计（元） */
  service_fee_total: string
  /** 单车总金额(元) */
  total_amount: string
  /** 备注(业务员) */
  salesman: string
  /** 其他（暂无数据来源，空串） */
  other: string
  /** 残值单开具日期（暂无数据来源，空串） */
  residual_invoice_date: string
  /** 发票（暂无数据来源，空串） */
  invoice: string
  /** 服务费发票（订单服务费发票号码） */
  service_fee_invoice: string
  /** 结算状态：pending 待结算 / settled 已结算 */
  status: Exclude<SettlementExportSettleStatus, ''>
  /** 结算状态文案 */
  is_settled_text: string
  [key: string]: unknown
}

export interface SettlementVehicleExportSearchParams {
  vehicle_no?: string
  owner_name?: string
  plate_no?: string
  payee_name?: string
  payee_account?: string
  salesman?: number | ''
  status?: SettlementExportSettleStatus
  start_time?: string
  end_time?: string
  page?: number
  limit?: number
  current?: number
  size?: number
}

export interface SettlementExportBusiness {
  id: number
  name: string
}

export interface SettlementVehicleExportResult {
  list: Record<string, string | number>[]
  count: number
}

/** 导出列分组（顺序与《2026年鑫广车辆结算明细》Excel 表头 A~AU 一致） */
export const SETTLEMENT_EXPORT_COLUMN_GROUPS = [
  '基础信息',
  '产权信息',
  '代理人信息',
  '车辆信息',
  '拖车/运费',
  '残值信息',
  '服务费',
  '其他信息'
] as const

/** 导出列定义（key / exportKey 均为接口原字段，46 列对应 Excel B~AU） */
export const SETTLEMENT_EXPORT_COLUMNS: SettlementExportColumnDef[] = [
  { key: 'vehicle_no', exportKey: 'vehicle_no', label: '自编号', group: '基础信息', width: 130 },
  { key: 'our_model', exportKey: 'our_model', label: '我司车型', group: '基础信息', width: 120 },
  { key: 'fuel_type', exportKey: 'fuel_type', label: '柴油/汽油', group: '基础信息', width: 80 },
  { key: 'add_time', exportKey: 'add_time', label: '信息录入日期', group: '基础信息', width: 130 },
  {
    key: 'factory_date',
    exportKey: 'factory_date',
    label: '入厂日期',
    group: '基础信息',
    width: 110
  },
  { key: 'entry_date', exportKey: 'entry_date', label: '入库日期', group: '基础信息', width: 110 },
  {
    key: 'warehouse_no',
    exportKey: 'warehouse_no',
    label: '入库单号',
    group: '基础信息',
    width: 140
  },
  {
    key: 'transport_date',
    exportKey: 'transport_date',
    label: '运单日期',
    group: '基础信息',
    width: 110,
    hidden: true
  },
  {
    key: 'transport_no',
    exportKey: 'transport_no',
    label: '运单编号',
    group: '基础信息',
    width: 130,
    hidden: true
  },
  {
    key: 'delivery_type',
    exportKey: 'delivery_type',
    label: '自送/拖运',
    group: '基础信息',
    width: 90,
    hidden: true
  },
  {
    key: 'owner_name',
    exportKey: 'owner_name',
    label: '车辆产权人',
    group: '产权信息',
    width: 130
  },
  {
    key: 'owner_id_card',
    exportKey: 'owner_id_card',
    label: '车辆产权人身份证/组织机构代码证',
    group: '产权信息',
    width: 200
  },
  {
    key: 'owner_bank',
    exportKey: 'owner_bank',
    label: '车主开户行',
    group: '产权信息',
    width: 120
  },
  {
    key: 'owner_card_no',
    exportKey: 'owner_card_no',
    label: '车主银行卡号',
    group: '产权信息',
    width: 160
  },
  { key: 'agent_name', exportKey: 'agent_name', label: '代理人', group: '代理人信息', width: 90 },
  {
    key: 'agent_id_card',
    exportKey: 'agent_id_card',
    label: '代理人身份证',
    group: '代理人信息',
    width: 160
  },
  {
    key: 'agent_phone',
    exportKey: 'agent_phone',
    label: '联系电话',
    group: '代理人信息',
    width: 110
  },
  {
    key: 'agent_bank',
    exportKey: 'agent_bank',
    label: '代理人开户行',
    group: '代理人信息',
    width: 120
  },
  {
    key: 'agent_card_no',
    exportKey: 'agent_card_no',
    label: '代理人银行卡号',
    group: '代理人信息',
    width: 150
  },
  { key: 'plate_no', exportKey: 'plate_no', label: '车牌号', group: '车辆信息', width: 90 },
  { key: 'vin', exportKey: 'vin', label: '车架号', group: '车辆信息', width: 170 },
  { key: 'engine_no', exportKey: 'engine_no', label: '发动机号', group: '车辆信息', width: 120 },
  {
    key: 'brand_model',
    exportKey: 'brand_model',
    label: '品牌型号',
    group: '车辆信息',
    width: 150
  },
  {
    key: 'vehicle_type',
    exportKey: 'vehicle_type',
    label: '车辆类型',
    group: '车辆信息',
    width: 90
  },
  { key: 'sales_qty', exportKey: 'sales_qty', label: '车辆数', group: '车辆信息', width: 70 },
  {
    key: 'prepared_weight',
    exportKey: 'prepared_weight',
    label: '整备质量(吨)',
    group: '车辆信息',
    width: 100
  },
  {
    key: 'central_weight',
    exportKey: 'central_weight',
    label: '中心结算吨位',
    group: '车辆信息',
    width: 110
  },
  {
    key: 'actual_weight',
    exportKey: 'actual_weight',
    label: '实际吨位',
    group: '车辆信息',
    width: 90
  },
  {
    key: 'tow_unit_price',
    exportKey: 'tow_unit_price',
    label: '拖车单价含税（元）',
    group: '拖车/运费',
    width: 130
  },
  {
    key: 'tow_missing_deduction',
    exportKey: 'tow_missing_deduction',
    label: '拖车缺件扣款',
    group: '拖车/运费',
    width: 110
  },
  {
    key: 'tow_fee_excl_tax',
    exportKey: 'tow_fee_excl_tax',
    label: '拖车费金额不含税（元）',
    group: '拖车/运费',
    width: 150
  },
  {
    key: 'freight_settle_date',
    exportKey: 'freight_settle_date',
    label: '运费结算日期',
    group: '拖车/运费',
    width: 120
  },
  {
    key: 'self_delivery_fee',
    exportKey: 'self_delivery_fee',
    label: '自送费（元/辆）',
    group: '拖车/运费',
    width: 110
  },
  {
    key: 'missing_compensation_pos',
    exportKey: 'missing_compensation_pos',
    label: '缺补件吨位',
    group: '残值信息',
    width: 100
  },
  {
    key: 'residual_unit_price',
    exportKey: 'residual_unit_price',
    label: '残值单价（元）',
    group: '残值信息',
    width: 110
  },
  {
    key: 'missing_parts',
    exportKey: 'missing_parts',
    label: '缺件(元)',
    group: '残值信息',
    width: 90
  },
  {
    key: 'residual_amount',
    exportKey: 'residual_amount',
    label: '实际支付残值金额',
    group: '残值信息',
    width: 130
  },
  {
    key: 'residual_settle_date',
    exportKey: 'residual_settle_date',
    label: '残值结算日期',
    group: '残值信息',
    width: 120
  },
  {
    key: 'service_fee_unit_price',
    exportKey: 'service_fee_unit_price',
    label: '服务费（元/吨）',
    group: '服务费',
    width: 110
  },
  {
    key: 'service_fee_total',
    exportKey: 'service_fee_total',
    label: '服务费合计（元）',
    group: '服务费',
    width: 120
  },
  {
    key: 'total_amount',
    exportKey: 'total_amount',
    label: '单车总金额(元)',
    group: '其他信息',
    width: 110
  },
  {
    key: 'salesman',
    exportKey: 'salesman',
    label: '备注(业务员)',
    group: '其他信息',
    width: 100
  },
  { key: 'other', exportKey: 'other', label: '其他', group: '其他信息', width: 90 },
  {
    key: 'residual_invoice_date',
    exportKey: 'residual_invoice_date',
    label: '残值单开具日期',
    group: '其他信息',
    width: 120
  },
  { key: 'invoice', exportKey: 'invoice', label: '发票', group: '其他信息', width: 100 },
  {
    key: 'service_fee_invoice',
    exportKey: 'service_fee_invoice',
    label: '服务费发票',
    group: '其他信息',
    width: 110
  }
]

export const SETTLEMENT_EXPORT_GROUP_COLORS: Record<string, [string, string]> = {
  基础信息: ['#E6F7FF', '#096DD9'],
  产权信息: ['#FFF7E6', '#D48806'],
  代理人信息: ['#F6FFED', '#389E0D'],
  车辆信息: ['#FFFBE6', '#876800'],
  '拖车/运费': ['#E6FFFB', '#006D75'],
  残值信息: ['#FFF1F0', '#CF1322'],
  服务费: ['#F9F0FF', '#531DAB'],
  其他信息: ['#F5F5F5', '#595959']
}
