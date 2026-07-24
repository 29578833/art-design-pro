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
}

/** 结算车辆导出列表项（接口原字段） */
export interface SettlementVehicleExportRow {
  id: number
  settlement_id: number
  vehicle_id: number
  order_id: number
  plate_no: string
  model: string
  vehicle_type: string
  prepared_weight: number
  actual_weight: number
  settlement_amount: number
  total_amount: number
  add_time: string
  remark: string
  settlement_type: string
  settlement_status: number
  settlement_time: string
  vehicle_no: string
  owner_name: string
  owner_id_card: string
  fuel_type: string
  vin: string
  engine_no: string
  drivetrain: string
  is_supervision: number
  delivery_method: string
  entry_time: string
  entry_no: string
  owner_phone: string
  agent_name: string
  agent_phone: string
  payee_name: string
  payee_account: string
  payee_bank: string
  business_id: number
  salesman: string
  agent_fee: number
  agent_invoice_no: string
  settlement_date: string
  settlement_type_text: string
  status: Exclude<SettlementExportSettleStatus, ''>
  delivery_type_text: string
  monitor_type_text: string
  warehouse_no: string
  service_fee_amount: number
  service_fee_invoice: string
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

export const SETTLEMENT_EXPORT_COLUMN_GROUPS = [
  '基础信息',
  '产权信息',
  '代理人信息',
  '收款信息',
  '服务费',
  '车辆信息',
  '结算信息'
] as const

export const SETTLEMENT_EXPORT_COLUMNS: SettlementExportColumnDef[] = [
  { key: 'vehicle_no', exportKey: 'vehicle_no', label: '自编号', group: '基础信息', width: 90 },
  { key: 'model', exportKey: 'our_model', label: '我司车型', group: '基础信息', width: 110 },
  { key: 'fuel_type', exportKey: 'fuel_type', label: '柴油/汽油', group: '基础信息', width: 80 },
  { key: 'add_time', exportKey: 'add_time', label: '信息录入日期', group: '基础信息', width: 108 },
  { key: 'entry_time', exportKey: 'entry_time', label: '入场日期', group: '基础信息', width: 92 },
  {
    key: 'warehouse_no',
    exportKey: 'warehouse_no',
    label: '入库单号',
    group: '基础信息',
    width: 108
  },
  {
    key: 'delivery_type_text',
    exportKey: 'delivery_type',
    label: '自送/托运',
    group: '基础信息',
    width: 80
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
    label: '产权人身份证/组织机构代码',
    group: '产权信息',
    width: 200
  },
  { key: 'agent_name', exportKey: 'agent_name', label: '代理人', group: '代理人信息', width: 90 },
  {
    key: 'agent_phone',
    exportKey: 'agent_phone',
    label: '代理人手机',
    group: '代理人信息',
    width: 110
  },
  {
    key: 'payee_name',
    exportKey: 'payee_name',
    label: '收款人名称',
    group: '收款信息',
    width: 120
  },
  {
    key: 'payee_account',
    exportKey: 'payee_account',
    label: '收款人账号',
    group: '收款信息',
    width: 160
  },
  {
    key: 'payee_bank',
    exportKey: 'payee_bank',
    label: '收款人开户行',
    group: '收款信息',
    width: 110
  },
  {
    key: 'service_fee_invoice',
    exportKey: 'service_fee_invoice',
    label: '服务费发票',
    group: '服务费',
    width: 88
  },
  {
    key: 'service_fee_amount',
    exportKey: 'service_fee_amount',
    label: '服务费金额(元)',
    group: '服务费',
    width: 110
  },
  { key: 'plate_no', exportKey: 'plate_no', label: '车牌号', group: '车辆信息', width: 90 },
  { key: 'vin', exportKey: 'vin', label: 'VIN/车架号', group: '车辆信息', width: 170 },
  { key: 'engine_no', exportKey: 'engine_no', label: '发动机号', group: '车辆信息', width: 120 },
  {
    key: 'prepared_weight',
    exportKey: 'prepared_weight',
    label: '整备质量(kg)',
    group: '车辆信息',
    width: 100
  },
  {
    key: 'actual_weight',
    exportKey: 'actual_weight',
    label: '实际重量(kg)',
    group: '车辆信息',
    width: 100
  },
  { key: 'drivetrain', exportKey: 'drive_type', label: '驱动类型', group: '车辆信息', width: 80 },
  {
    key: 'monitor_type_text',
    exportKey: 'monitor_type',
    label: '监销类型',
    group: '车辆信息',
    width: 80
  },
  { key: 'status', exportKey: 'is_settled', label: '是否结算', group: '结算信息', width: 80 },
  {
    key: 'settlement_amount',
    exportKey: 'settlement_amount',
    label: '结算金额(元)',
    group: '结算信息',
    width: 110
  },
  {
    key: 'settlement_date',
    exportKey: 'settlement_date',
    label: '结算日期',
    group: '结算信息',
    width: 92
  },
  { key: 'salesman', exportKey: 'salesman', label: '业务员', group: '结算信息', width: 80 },
  { key: 'remark', exportKey: 'remark', label: '备注', group: '结算信息', width: 100 }
]

export const SETTLEMENT_EXPORT_GROUP_COLORS: Record<string, [string, string]> = {
  基础信息: ['#E6F7FF', '#096DD9'],
  产权信息: ['#FFF7E6', '#D48806'],
  代理人信息: ['#F6FFED', '#389E0D'],
  收款信息: ['#FFF1F0', '#CF1322'],
  服务费: ['#F9F0FF', '#531DAB'],
  车辆信息: ['#FFFBE6', '#876800'],
  结算信息: ['#E6FFFB', '#006D75']
}
