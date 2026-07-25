/** 报废车辆质检汇总表 vxe-grid 列配置 */

const th = { align: 'center' as const, headerAlign: 'center' as const }

/** 收车日期展示：03月15日 */
export function formatCollectDate(date?: string) {
  if (!date) return '—'
  const parts = date.split('-')
  if (parts.length >= 3) return `${parts[1]}月${parts[2]}日`
  return date
}

type QcColumn = ReturnType<typeof buildQcColumns>[number]

/** 展平叶子列（含分组表头） */
export function flattenQcColumns(columns: QcColumn[] = buildQcColumns()) {
  const leaf: { field?: string; type?: string }[] = []
  columns.forEach((col) => {
    if ('children' in col && Array.isArray(col.children) && col.children.length) {
      col.children.forEach((child) => {
        leaf.push({ field: child.field, type: (child as { type?: string }).type })
      })
    } else {
      leaf.push({
        field: (col as { field?: string }).field,
        type: (col as { type?: string }).type
      })
    }
  })
  return leaf
}

/** 左侧固定列数 */
export const QC_FIXED_COL_COUNT = 2

/** 合计行跨列信息 */
export function getQcFooterMeta(columns = flattenQcColumns()) {
  const weightIdx = columns.findIndex((c) => c.field === 'weight')
  return {
    weightIdx,
    labelColspan: weightIdx,
    tailColspan: columns.length - weightIdx - 1,
    colCount: columns.length
  }
}

/** 是否为左侧固定列 footer 区 */
export function isQcFixedFooterColumns(columns: { field?: string; type?: string }[]) {
  return columns.length === QC_FIXED_COL_COUNT && columns[0]?.type === 'seq'
}

export function buildQcColumns() {
  return [
    {
      type: 'seq' as const,
      title: '序号',
      width: 50,
      fixed: 'left' as const,
      headerClassName: 'qc-leaf-base',
      className: 'qc-cell-seq',
      ...th
    },
    {
      field: 'vehicle_no',
      title: '车辆档案号',
      width: 110,
      fixed: 'left' as const,
      headerClassName: 'qc-leaf-archive',
      className: 'qc-cell-archive',
      slots: { default: 'vehicle_no' },
      ...th
    },
    {
      field: 'collect_date',
      title: '收车日期',
      width: 88,
      headerClassName: 'qc-leaf-base',
      slots: { default: 'collect_date' },
      ...th
    },
    {
      field: 'self_no',
      title: '自编号',
      width: 88,
      headerClassName: 'qc-leaf-base',
      slots: { default: 'self_no' },
      ...th
    },
    {
      field: 'plate_no',
      title: '车牌号',
      width: 96,
      headerClassName: 'qc-leaf-base',
      slots: { default: 'plate_no' },
      ...th
    },
    {
      field: 'qc_status_text',
      title: '质检状态',
      width: 110,
      headerClassName: 'qc-leaf-base',
      slots: { default: 'qc_status' },
      ...th
    },
    {
      field: 'owner_type',
      title: '私家车/非私家车',
      width: 110,
      headerClassName: 'qc-leaf-base',
      slots: { default: 'owner_type' },
      ...th
    },
    {
      field: 'emission_standard',
      title: '排量（排放标准）',
      width: 100,
      headerClassName: 'qc-leaf-base',
      slots: { default: 'emission_standard' },
      ...th
    },
    {
      field: 'vehicle_type_text',
      title: '车型',
      width: 110,
      headerClassName: 'qc-leaf-base',
      ...th
    },
    {
      field: 'plate_status',
      title: '号牌（牌照）',
      width: 100,
      headerClassName: 'qc-leaf-base',
      slots: { default: 'plate_status' },
      ...th
    },
    {
      field: 'owner_name',
      title: '车主',
      width: 90,
      headerClassName: 'qc-leaf-base',
      slots: { default: 'owner_name' },
      ...th
    },
    { field: 'business_name', title: '业务员', width: 80, headerClassName: 'qc-leaf-base', ...th },
    { field: 'agent_name', title: '代理人', width: 80, headerClassName: 'qc-leaf-base', ...th },
    {
      field: 'delivery_type',
      title: '拖车/自送',
      width: 88,
      headerClassName: 'qc-leaf-base',
      slots: { default: 'delivery_type' },
      ...th
    },
    {
      field: 'driver_name',
      title: '拖车号码/驾驶员',
      width: 120,
      headerClassName: 'qc-leaf-base',
      slots: { default: 'driver_name' },
      ...th
    },
    {
      field: 'fuel_type_text',
      title: '驱动类型',
      width: 90,
      headerClassName: 'qc-leaf-base',
      slots: { default: 'fuel_type_text' },
      ...th
    },
    {
      title: '质检结果',
      headerClassName: 'qc-group-result',
      children: [
        {
          field: 'weight',
          title: '磅重/kg',
          width: 88,
          headerClassName: 'qc-leaf-result',
          className: 'qc-cell-result',
          slots: { default: 'weight' },
          ...th
        },
        {
          field: 'battery_status',
          title: '电瓶',
          width: 80,
          headerClassName: 'qc-leaf-result',
          className: 'qc-cell-result',
          slots: { default: 'battery_status' },
          ...th
        },
        {
          field: 'catalyst_status',
          title: '三元催化',
          width: 80,
          headerClassName: 'qc-leaf-result',
          className: 'qc-cell-result',
          slots: { default: 'catalyst_status' },
          ...th
        },
        {
          field: 'deduction',
          title: '杂件/缺件扣款',
          width: 120,
          headerClassName: 'qc-leaf-result',
          className: 'qc-cell-result qc-cell-deduction',
          slots: { default: 'deduction' },
          ...th,
          align: 'left' as const
        }
      ]
    },
    {
      field: 'check_no',
      title: '质检单号',
      width: 120,
      headerClassName: 'qc-leaf-base',
      slots: { default: 'check_no' },
      ...th
    },
    { field: 'inspector_name', title: '质检员', width: 80, headerClassName: 'qc-leaf-base', ...th }
  ]
}

/** 质检状态 badge 样式 */
export function qcStatusClass(status: string) {
  if (status === 'completed') return 'is-completed'
  if (status === 'in_progress') return 'is-progress'
  if (status === 'failed') return 'is-failed'
  if (status === 'pending_materials') return 'is-pending-materials'
  return 'is-default'
}

/** 运输方式文案 */
export function deliveryTypeText(type?: string) {
  if (type === 'tow') return '拖车'
  if (type === 'self') return '自送'
  return type || '—'
}

/** 车主类型文案 */
export function ownerTypeText(type?: string) {
  if (type === 'personal') return '私家车'
  if (type === 'corporate') return '非私家车'
  return '—'
}
