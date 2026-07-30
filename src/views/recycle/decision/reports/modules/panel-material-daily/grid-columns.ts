/** 原料日报表 vxe-grid 列配置 */

const th = { align: 'center' as const, headerAlign: 'center' as const }

type MdColumn = ReturnType<typeof buildMaterialDailyColumns>[number]

/** 展平叶子列 */
export function flattenMdColumns(columns: MdColumn[] = buildMaterialDailyColumns()) {
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

/** 数值列字段（用于合计） */
export const MD_SUM_FIELDS = [
  'init_weight',
  'init_count',
  'today_in_weight',
  'today_in_count',
  'today_out_weight',
  'today_out_count',
  'month_in_weight',
  'month_in_count',
  'month_out_weight',
  'month_out_count',
  'stock_weight',
  'stock_count'
] as const

export function buildMaterialDailyColumns() {
  const pair = (
    title: string,
    weightField: string,
    countField: string,
    groupClass: string,
    leafClass: string,
    cellClass: string
  ) => ({
    title,
    headerClassName: groupClass,
    children: [
      {
        field: weightField,
        title: '重量',
        minWidth: 72,
        headerClassName: leafClass,
        className: cellClass,
        slots: { default: weightField },
        ...th
      },
      {
        field: countField,
        title: '数量',
        minWidth: 64,
        headerClassName: leafClass,
        className: cellClass,
        slots: { default: countField },
        ...th
      }
    ]
  })

  return [
    {
      type: 'seq' as const,
      title: '序号',
      minWidth: 50,
      headerClassName: 'md-head-base',
      className: 'md-cell-seq',
      ...th
    },
    {
      field: 'name',
      title: '名称',
      minWidth: 180,
      headerClassName: 'md-head-base',
      slots: { default: 'name' },
      ...th
    },
    {
      field: 'spec',
      title: '规格',
      minWidth: 72,
      headerClassName: 'md-head-base',
      slots: { default: 'spec' },
      ...th
    },
    pair(
      '原料初期库数',
      'init_weight',
      'init_count',
      'md-group-init',
      'md-leaf-init',
      'md-col-init'
    ),
    pair(
      '本日入库量',
      'today_in_weight',
      'today_in_count',
      'md-group-in',
      'md-leaf-in',
      'md-col-in'
    ),
    pair(
      '本日出库数',
      'today_out_weight',
      'today_out_count',
      'md-group-out',
      'md-leaf-out',
      'md-col-out'
    ),
    pair(
      '本月入库量',
      'month_in_weight',
      'month_in_count',
      'md-group-month-in',
      'md-leaf-month-in',
      'md-col-month-in'
    ),
    pair(
      '本月出库累计',
      'month_out_weight',
      'month_out_count',
      'md-group-month-out',
      'md-leaf-month-out',
      'md-col-month-out'
    ),
    pair(
      '本日结存',
      'stock_weight',
      'stock_count',
      'md-group-stock',
      'md-leaf-stock',
      'md-col-stock'
    )
  ]
}

/** 格式化数值：0 显示空 */
export function fmtMdNumber(val?: string | number | null) {
  if (val === '' || val === null || val === undefined) return ''
  const n = Number(val)
  if (!n) return ''
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

/** 解析数值用于合计 */
export function parseMdNumber(val?: string | number | null) {
  if (val === '' || val === null || val === undefined) return 0
  const n = Number(val)
  return Number.isFinite(n) ? n : 0
}
