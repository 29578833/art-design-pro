/** 报废车拆解报表 vxe-grid 列配置（对齐原型三级/四级表头） */

export const DD_VEHICLE_SUM_FIELDS = [
  // 前期在制品数量
  'prev_wip_count',
  // 前期在制品重量
  'prev_wip_weight',
  // 当日入厂数量
  'today_receive_count',
  // 当日入厂重量
  'today_receive_weight',
  // 本月累计入厂数量
  'month_receive_count',
  // 本月累计入厂重量
  'month_receive_weight',
  // 当日拆解数量
  'today_dismantle_count',
  // 当日拆解重量
  'today_dismantle_weight',
  // 本月累计拆解数量
  'month_dismantle_count',
  // 本月累计拆解重量
  'month_dismantle_weight',
  // 当日在制品数量
  'today_wip_count',
  // 当日在制品重量
  'today_wip_weight'
] as const

export type DdVehicleSumField = (typeof DD_VEHICLE_SUM_FIELDS)[number]

export const DD_STORAGE_SUM_FIELDS = [
  'today_storage_count',
  'today_storage_weight',
  'month_storage_count',
  'month_storage_weight'
] as const

export type DdStorageSumField = (typeof DD_STORAGE_SUM_FIELDS)[number]

export function parseDdNumber(val?: string | number) {
  if (val === '' || val === null || val === undefined) return 0
  const n = Number(String(val).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function fmtDdNumber(val?: string | number, digits = 2) {
  const n = parseDdNumber(val)
  if (!n) return ''
  return n % 1 === 0 ? String(n) : n.toFixed(digits)
}

/**
 * 车辆表：序号/车型 + 6 组（组名 → 正常报废 → 数量/重量）
 * 表体底色对齐原型：多数组仅重量列有底色，前期在制品两列都有
 */
export function buildDismantleVehicleColumns() {
  const th = { align: 'center' as const, headerAlign: 'center' as const }

  const pair = (
    title: string,
    countField: string,
    weightField: string,
    groupClass: string,
    countCellClass: string,
    weightCellClass: string
  ) => ({
    title,
    headerClassName: groupClass,
    children: [
      {
        title: '正常报废',
        headerClassName: groupClass,
        children: [
          {
            field: countField,
            title: '数量(台)',
            minWidth: 70,
            headerClassName: 'dd-head-leaf',
            className: countCellClass,
            slots: { default: countField },
            ...th
          },
          {
            field: weightField,
            title: '重量(吨)',
            minWidth: 78,
            headerClassName: 'dd-head-leaf',
            className: weightCellClass,
            slots: { default: weightField },
            ...th
          }
        ]
      }
    ]
  })

  return [
    {
      type: 'seq' as const,
      title: '序号',
      width: 48,
      className: 'dd-cell-seq',
      headerClassName: 'dd-head-base',
      ...th
    },
    {
      field: 'name',
      title: '车型',
      minWidth: 128,
      align: 'center' as const,
      headerAlign: 'center' as const,
      headerClassName: 'dd-head-base',
      className: 'dd-cell-name',
      slots: { default: 'name' }
    },
    pair(
      '前期在制品',
      'prev_wip_count',
      'prev_wip_weight',
      'dd-group-prev',
      'dd-col-prev',
      'dd-col-prev'
    ),
    pair(
      '本日领料',
      'today_receive_count',
      'today_receive_weight',
      'dd-group-today-in',
      '',
      'dd-col-today-in-wt'
    ),
    pair(
      '本月累计领料',
      'month_receive_count',
      'month_receive_weight',
      'dd-group-month-in',
      '',
      'dd-col-month-in-wt'
    ),
    pair(
      '本日拆解',
      'today_dismantle_count',
      'today_dismantle_weight',
      'dd-group-today-out',
      '',
      'dd-col-today-out-wt'
    ),
    pair(
      '本月累计拆解',
      'month_dismantle_count',
      'month_dismantle_weight',
      'dd-group-month-out',
      '',
      'dd-col-month-out-wt'
    ),
    pair(
      '本日累计在制品',
      'today_wip_count',
      'today_wip_weight',
      'dd-group-wip',
      '',
      'dd-col-wip-wt'
    )
  ]
}

/**
 * 产物表：类别 / 名称 + 本日缴库(数量→件, 重量→吨) + 本月累计缴库
 * 「产物缴库」总标题放在表格上方条，不塞进列树
 */
export function buildDismantleStorageColumns() {
  const th = { align: 'center' as const, headerAlign: 'center' as const }

  const metric = (
    groupTitle: string,
    groupClass: string,
    countField: string,
    weightField: string,
    unitClass: string,
    countCell: string,
    weightCell: string
  ) => ({
    title: groupTitle,
    headerClassName: groupClass,
    children: [
      {
        title: '数量',
        headerClassName: 'dd-head-leaf',
        children: [
          {
            field: countField,
            title: '件',
            minWidth: 72,
            headerClassName: unitClass,
            className: countCell,
            slots: { default: countField },
            ...th
          }
        ]
      },
      {
        title: '重量',
        headerClassName: 'dd-head-leaf',
        children: [
          {
            field: weightField,
            title: '吨',
            minWidth: 80,
            headerClassName: unitClass,
            className: weightCell,
            slots: { default: weightField },
            ...th
          }
        ]
      }
    ]
  })

  return [
    {
      field: 'category',
      title: '类别',
      width: 88,
      headerClassName: 'dd-head-base',
      className: 'dd-col-category',
      slots: { default: 'category' },
      ...th
    },
    {
      field: 'product_name',
      title: '产物名称',
      minWidth: 220,
      align: 'left' as const,
      headerAlign: 'left' as const,
      headerClassName: 'dd-head-base',
      className: 'dd-cell-product',
      slots: { default: 'product_name' }
    },
    metric(
      '本日缴库',
      'dd-group-today-in',
      'today_storage_count',
      'today_storage_weight',
      'dd-unit-today-in',
      '',
      'dd-col-today-in-wt'
    ),
    metric(
      '本月累计缴库',
      'dd-group-today-out',
      'month_storage_count',
      'month_storage_weight',
      'dd-unit-today-out',
      '',
      'dd-col-today-out-wt'
    )
  ]
}

export function categoryColor(cat: string) {
  if (cat === '危废') return { bg: '#FFF1F0', fg: '#CF1322' }
  if (cat === '五大总成') return { bg: '#E6F7FF', fg: '#096DD9' }
  if (cat === '水箱') return { bg: '#F6FFED', fg: '#389E0D' }
  return { bg: '#FFF7E6', fg: '#D46B08' }
}
