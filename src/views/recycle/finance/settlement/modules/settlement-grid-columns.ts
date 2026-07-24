/** 结算弹窗 vxe-grid 列配置 */

export type SettlementGridColumn = Record<string, unknown>

const thBase = { align: 'center', headerAlign: 'center' as const }

/** Step1 选车表列 */
export function buildCreateStep1Columns(isService: boolean): SettlementGridColumn[] {
  const cols: SettlementGridColumn[] = [
    { type: 'checkbox', width: 44, fixed: 'left', ...thBase },
    { type: 'seq', title: '序号', width: 56, ...thBase },
    {
      field: 'entry_time',
      title: '入库日期',
      width: 110,
      slots: { default: 'entry_time' },
      ...thBase
    },
    { field: 'vehicle_no', title: '自编号', width: 130, ...thBase },
    { field: 'plate_no', title: '车牌号', width: 90, slots: { default: 'plate_no' }, ...thBase },
    { field: 'model', title: '车型', width: 100, ...thBase },
    { field: 'vehicle_type', title: '车辆类型', width: 100, ...thBase },
    { field: 'settlement_method', title: '结算类型', width: 88, ...thBase },
    {
      field: 'weight',
      title: '整备总量(吨)',
      width: 100,
      slots: { default: 'weight' },
      ...thBase
    },
    {
      field: 'qc_weight',
      title: '实际重量(吨)',
      width: 100,
      slots: { default: 'qc_weight' },
      ...thBase
    },
    {
      field: 'self_delivery_subsidy',
      title: '自送费补贴(元)',
      width: 108,
      ...thBase
    },
    {
      field: 'missing_compensation_pos',
      title: '缺补件补位(吨)',
      width: 108,
      ...thBase
    },
    { field: 'residual_value', title: '残值单价(元)', width: 100, ...thBase },
    { field: 'missing_parts', title: '缺件(件)', width: 80, ...thBase },
    {
      field: 'missing_deduction',
      title: '最终缺件免赔款',
      width: 112,
      slots: { default: 'missing_deduction' },
      ...thBase
    },
    {
      field: 'actual_pay_amount',
      title: '实际支付残值金额(元)',
      width: 140,
      slots: { default: 'actual_pay_amount' },
      ...thBase
    }
  ]

  if (isService) {
    cols.push(
      { field: 'service_fee_unit_price', title: '服务费(元/吨)', width: 100, ...thBase },
      {
        field: 'service_fee_total',
        title: '服务费合计(元)',
        width: 108,
        slots: { default: 'service_fee_total' },
        ...thBase
      }
    )
  }

  cols.push({
    field: 'single_total',
    title: '单车总金额(元)',
    width: 120,
    slots: { default: 'single_total', header: 'auto_total_header' },
    ...thBase
  })

  return cols
}

/** Step2 确认表列 */
export function buildCreateStep2Columns(isService: boolean): SettlementGridColumn[] {
  const editHeader = { headerClassName: 'fs-vxe-edit-header' }

  const cols: SettlementGridColumn[] = [
    { type: 'seq', title: '序号', width: 56, ...thBase },
    {
      field: 'entry_time',
      title: '信息录入日期',
      width: 110,
      slots: { default: 'entry_time' },
      ...thBase
    },
    { field: 'vehicle_no', title: '自编号', width: 130, ...thBase },
    { field: 'plate_no', title: '车牌号', width: 90, slots: { default: 'plate_no' }, ...thBase },
    { field: 'model', title: '车辆类型', width: 100, ...thBase },
    { field: 'settlement_method', title: '结算类型', width: 88, ...thBase },
    {
      field: 'weight',
      title: '整备质量(吨)',
      width: 100,
      slots: { default: 'weight' },
      ...thBase
    },
    {
      field: 'actual_weight',
      title: '实际重量(吨)',
      width: 100,
      slots: { default: 'edit_actual_weight' },
      ...editHeader,
      ...thBase
    },
    {
      field: 'self_delivery_subsidy',
      title: '自送费补贴(元)',
      width: 108,
      slots: { default: 'self_delivery_subsidy' },
      ...thBase
    },
    {
      field: 'missing_compensation_pos',
      title: '缺补件吨位(吨)',
      width: 108,
      slots: { default: 'edit_missing_compensation_pos' },
      ...editHeader,
      ...thBase
    },
    {
      field: 'residual_value',
      title: '残值单价(元)',
      width: 100,
      slots: { default: 'edit_residual_value' },
      ...editHeader,
      ...thBase
    },
    {
      field: 'missing_parts',
      title: '缺件(元)',
      width: 80,
      slots: { default: 'edit_missing_parts' },
      ...editHeader,
      ...thBase
    },
    { field: 'hub_material', title: '轮毂材质', width: 80, ...thBase },
    {
      field: 'deduction',
      title: '扣款(元)',
      width: 80,
      slots: { default: 'edit_deduction' },
      ...editHeader,
      ...thBase
    },
    {
      field: 'missing_deduction',
      title: '缺件免扣款',
      width: 96,
      slots: { default: 'missing_deduction' },
      ...thBase
    },
    {
      field: 'actual_pay_amount',
      title: '预计支付残值金额',
      width: 120,
      slots: { default: 'edit_actual_pay_amount' },
      ...editHeader,
      ...thBase
    }
  ]

  if (isService) {
    cols.push(
      { field: 'service_fee_unit_price', title: '服务费(元/吨)', width: 100, ...thBase },
      {
        field: 'service_fee_total',
        title: '服务费合计(元)',
        width: 108,
        slots: { default: 'service_fee_total' },
        ...thBase
      }
    )
  }

  cols.push(
    {
      field: 'single_total',
      title: '单车总金额(元)',
      width: 120,
      slots: { default: 'edit_total', header: 'auto_total_header' },
      ...editHeader,
      ...thBase
    },
    {
      field: 'modify_remark',
      title: '修改说明',
      width: 100,
      slots: { default: 'edit_modify_remark' },
      ...editHeader,
      ...thBase
    },
    {
      field: 'remark',
      title: '质检缺件备注',
      width: 120,
      slots: { default: 'remark' },
      ...thBase
    },
    {
      field: 'action',
      title: '操作',
      width: 72,
      fixed: 'right',
      slots: { default: 'action' },
      ...thBase
    }
  )

  return cols
}

/** 详情弹窗列 */
export function buildDetailColumns(isService: boolean): SettlementGridColumn[] {
  const cols: SettlementGridColumn[] = [
    { field: 'entry_date', title: '入库日期', width: 130, ...thBase },
    { field: 'vehicle_no', title: '自编号', width: 130, ...thBase },
    { field: 'plate_no', title: '车牌号', width: 90, slots: { default: 'plate_no' }, ...thBase },
    {
      field: 'warehouse_no',
      title: '入库单号',
      width: 140,
      slots: { default: 'warehouse_no' },
      ...thBase
    }
  ]

  if (!isService) {
    cols.push({ field: 'vehicle_type', title: '车辆类型', width: 100, ...thBase })
  }

  cols.push(
    { field: 'settlement_method_text', title: '结算类型', width: 88, ...thBase },
    {
      field: 'prepared_weight_ton',
      title: '整备质量(吨)',
      width: 100,
      slots: { default: 'prepared_weight_ton' },
      ...thBase
    },
    {
      field: 'actual_weight_ton',
      title: '实际重量(吨)',
      width: 100,
      slots: { default: 'actual_weight_ton' },
      ...thBase
    },
    {
      field: 'self_delivery_subsidy',
      title: '自送费补贴(元)',
      width: 108,
      slots: { default: 'self_delivery_subsidy' },
      ...thBase
    },
    {
      field: 'missing_compensation_pos_ton',
      title: '缺补件吨位(吨)',
      width: 108,
      slots: { default: 'missing_compensation_pos_ton' },
      ...thBase
    },
    { field: 'residual_unit_price', title: '残值单价(元)', width: 100, ...thBase },
    {
      field: 'missing_parts',
      title: '缺件(元)',
      width: 80,
      slots: { default: 'missing_parts' },
      ...thBase
    },
    {
      field: 'missing_deduction',
      title: '质检缺件免扣款',
      width: 108,
      slots: { default: 'missing_deduction' },
      ...thBase
    },
    {
      field: 'actual_pay_amount',
      title: '实际支付残值金额(元)',
      width: 140,
      slots: { default: 'actual_pay_amount' },
      ...thBase
    },
    {
      field: 'service_fee_unit_price',
      title: '服务费(元/吨)',
      width: 100,
      slots: { default: 'service_fee_unit_price' },
      ...thBase
    },
    {
      field: 'service_fee_total',
      title: '服务费合计(元)',
      width: 108,
      slots: { default: 'service_fee_total' },
      ...thBase
    }
  )

  if (isService) {
    cols.push({
      field: 'modify_remark',
      title: '修改说明',
      width: 100,
      slots: { default: 'modify_remark' },
      ...thBase
    })
  }

  cols.push({
    field: 'total_amount',
    title: '单车总金额(元)',
    width: 120,
    slots: { default: 'total_amount', header: 'auto_total_header' },
    ...thBase
  })

  if (!isService) {
    cols.push({
      field: 'modify_remark',
      title: '修改说明',
      width: 100,
      slots: { default: 'modify_remark' },
      ...thBase
    })
  }

  cols.push(
    {
      field: 'remark',
      title: '质检缺件备注',
      width: 120,
      slots: { default: 'remark' },
      ...thBase
    },
    {
      field: 'audit_status_text',
      title: '审核状态',
      width: 88,
      slots: { default: 'audit_status_text' },
      ...thBase
    },
    {
      field: 'reject_reason',
      title: '驳回原因',
      width: 120,
      slots: { default: 'reject_reason' },
      ...thBase
    },
    {
      field: 'audit_user_name',
      title: '审核人',
      width: 80,
      slots: { default: 'audit_user_name' },
      ...thBase
    },
    {
      field: 'audit_time',
      title: '审核时间',
      width: 140,
      slots: { default: 'audit_time' },
      ...thBase
    },
    {
      field: 'apply_remark',
      title: '申请备注',
      width: 120,
      slots: { default: 'apply_remark' },
      ...thBase
    },
    {
      field: 'qc_btn',
      title: '质检查验信息',
      width: 108,
      fixed: 'right',
      slots: { default: 'qc_btn' },
      ...thBase
    },
    {
      field: 'attach_btn',
      title: '车辆附件',
      width: 88,
      fixed: 'right',
      slots: { default: 'attach_btn' },
      ...thBase
    }
  )

  return cols
}

/** Step2 合计行：单车总金额列索引（0-based） */
export function getCreateStep2TotalColIndex(isService: boolean): number {
  return isService ? 18 : 16
}

/** 详情合计行：单车总金额列索引 */
export function getDetailTotalColIndex(): number {
  return 16
}
