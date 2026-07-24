import type { SettlementBillType } from '@/types/recycle/finance-settlement'

/** 可结算车辆（vehicle_list 接口原字段） */
export interface SettlementVehicleCandidate {
  /** 车辆 ID */
  id: number
  /** 自编号 */
  vehicle_no: string
  /** 车牌号 */
  plate_no: string
  /** 品牌 */
  brand: string
  /** 车型 */
  model: string
  /** 车辆类型 */
  vehicle_type: string
  /** 车辆重量（kg） */
  weight: number
  /** 交付方式 */
  delivery_method: string
  /** 入厂时间戳 */
  entry_time: number | string
  /** 订单号 */
  order_no: string
  /** 订单单价 */
  unit_price: number
  /** 残值单价 */
  residual_value: number
  /** 自送补贴 */
  self_delivery_subsidy: number
  /** 结算方式 */
  settlement_method: string
  /** 服务费单价 */
  service_fee_unit_price: number
  /** 过磅时间 */
  weigh_time: string
  /** 质检重量（kg） */
  qc_weight: number
  /** 皮重（kg） */
  tare_weight: number
  /** 扣重（kg） */
  deduction_weight: number
  /** 是否已结算 */
  is_settled: number
}

/** 创建弹窗本地可编辑字段 */
export type SettlementVehicleEdit = {
  actual_weight?: number
  missing_compensation_pos?: number
  residual_unit_price?: number
  missing_parts?: number
  deduction?: number
  modify_remark?: string
  actual_pay_amount?: number
  single_total?: number
}

/** 创建结算单的单车提交字段 */
export interface SettlementCreateVehiclePayload {
  vehicle_id: number
  plate_no: string
  model: string
  vehicle_type: string
  vehicle_no: string
  settlement_method: string
  entry_time: number | string
  prepared_weight: number
  actual_weight: number
  tare_weight: number
  deduction_weight: number
  self_delivery_subsidy: number
  missing_compensation_pos: number
  residual_unit_price: number
  missing_parts: number
  deduction: number
  missing_deduction: number
  residual_amount: number
  actual_pay_amount: number
  service_fee_unit_price: number
  service_fee_total: number
  single_total: number
  total_amount: number
}

/** 批量创建结算单请求 */
export interface SettlementBillCreatePayload {
  settlement_type: SettlementBillType
  vehicles: SettlementCreateVehiclePayload[]
  contract_no?: string
  remark?: string
}

/** 可结算车辆分页响应 */
export interface SettlementVehicleCandidateList {
  list: SettlementVehicleCandidate[]
  total: number
}
