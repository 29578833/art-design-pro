// ==================== 结算车辆导出宽表 ====================

export type SettlementExportSettleStatus = '待结算' | '已结算'

export interface SettlementExportColumnDef {
  key: string
  label: string
  group: string
  width?: number
}

export interface SettlementVehicleExportRow {
  self_no: string
  vehicle_type: string
  fuel_type: string
  record_date: string
  entry_date: string
  inbound_date: string
  inbound_no: string
  waybill_date: string
  waybill_no: string
  delivery_type: string
  owner: string
  owner_id_no: string
  owner_bank: string
  owner_card: string
  agent: string
  agent_id_no: string
  agent_phone: string
  payee_name: string
  payee_acct: string
  payee_bank: string
  svc_inv: string
  svc_pay_date: string
  svc_amt: number
  plate: string
  vin: string
  engine_no: string
  std_weight: number
  actual_weight: number
  drive_type: string
  supervision: string
  settle_status: SettlementExportSettleStatus
  settle_amt: number
  settle_date: string
  salesman: string
  remark: string
}

export interface SettlementVehicleExportSearchParams {
  plate?: string
  self_no?: string
  salesman?: string
  settle_status?: SettlementExportSettleStatus | ''
  date_start?: string
  date_end?: string
  page?: number
  limit?: number
  current?: number
  size?: number
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
  { key: 'self_no', label: '自编号', group: '基础信息', width: 90 },
  { key: 'vehicle_type', label: '我司车型', group: '基础信息', width: 110 },
  { key: 'fuel_type', label: '柴油/汽油', group: '基础信息', width: 80 },
  { key: 'record_date', label: '信息录入日期', group: '基础信息', width: 108 },
  { key: 'entry_date', label: '入场日期', group: '基础信息', width: 92 },
  { key: 'inbound_date', label: '入库日期', group: '基础信息', width: 92 },
  { key: 'inbound_no', label: '入库单号', group: '基础信息', width: 108 },
  { key: 'waybill_date', label: '运单日期', group: '基础信息', width: 92 },
  { key: 'waybill_no', label: '运单编号', group: '基础信息', width: 120 },
  { key: 'delivery_type', label: '自送/托运', group: '基础信息', width: 80 },
  { key: 'owner', label: '车辆产权人', group: '产权信息', width: 130 },
  { key: 'owner_id_no', label: '产权人身份证/组织机构代码', group: '产权信息', width: 200 },
  { key: 'owner_bank', label: '车主开户行', group: '产权信息', width: 110 },
  { key: 'owner_card', label: '车主银行卡号', group: '产权信息', width: 160 },
  { key: 'agent', label: '代理人', group: '代理人信息', width: 90 },
  { key: 'agent_id_no', label: '代理人身份证号', group: '代理人信息', width: 160 },
  { key: 'agent_phone', label: '代理人手机', group: '代理人信息', width: 110 },
  { key: 'payee_name', label: '收款人名称', group: '收款信息', width: 120 },
  { key: 'payee_acct', label: '收款人账号', group: '收款信息', width: 160 },
  { key: 'payee_bank', label: '收款人开户行', group: '收款信息', width: 110 },
  { key: 'svc_inv', label: '服务费发票', group: '服务费', width: 88 },
  { key: 'svc_pay_date', label: '服务费付款日期', group: '服务费', width: 115 },
  { key: 'svc_amt', label: '服务费金额(元)', group: '服务费', width: 110 },
  { key: 'plate', label: '车牌号', group: '车辆信息', width: 90 },
  { key: 'vin', label: 'VIN/车架号', group: '车辆信息', width: 170 },
  { key: 'engine_no', label: '发动机号', group: '车辆信息', width: 120 },
  { key: 'std_weight', label: '整备质量(kg)', group: '车辆信息', width: 100 },
  { key: 'actual_weight', label: '实际重量(kg)', group: '车辆信息', width: 100 },
  { key: 'drive_type', label: '驱动类型', group: '车辆信息', width: 80 },
  { key: 'supervision', label: '监销类型', group: '车辆信息', width: 80 },
  { key: 'settle_status', label: '是否结算', group: '结算信息', width: 80 },
  { key: 'settle_amt', label: '结算金额(元)', group: '结算信息', width: 110 },
  { key: 'settle_date', label: '结算日期', group: '结算信息', width: 92 },
  { key: 'salesman', label: '业务员', group: '结算信息', width: 80 },
  { key: 'remark', label: '备注', group: '结算信息', width: 100 }
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
