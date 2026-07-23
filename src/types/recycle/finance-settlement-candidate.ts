import type { SettlementBillType } from '@/types/recycle/finance-settlement'

import type { SettlementBillLineItem } from '@/types/recycle/finance-settlement'

/** 新建结算单 — 可选车辆 */
export interface SettlementVehicleCandidate {
  id: string
  inbound_date: string
  self_no: string
  plate: string
  vehicle_model: string
  vehicle_type: string
  settle_type: string
  std_weight: number
  actual_weight: number
  self_transport: number
  shortfall_weight: number
  residual_price: number
  shortfall_parts: number
  svc_per_ton: number
  hub_material: string
  deduction: number
  modify_note: string
  qc_missing_note: string
}

export type SettlementVehicleEdit = {
  actual_weight?: number
  shortfall_weight?: number
  residual_price?: number
  shortfall_parts?: number
  deduction?: number
  modify_note?: string
  expected_residual_override?: number
  total_override?: number
}

export interface SettlementBillCreatePayload {
  settlement_type: SettlementBillType
  contract_no: string
  order_no: string
  charge_type: string
  applicant: string
  apply_time: string
  amount: number
  items: SettlementBillLineItem[]
}
