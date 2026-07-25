/** 原料出入库清单 vxe-grid 列配置 */
const th = { align: 'center' as const, headerAlign: 'center' as const }
type RmiColumn = ReturnType<typeof buildMaterialInOutColumns>[number]

/** 展平叶子列 */
export function flattenRmiColumns(columns: RmiColumn[] = buildMaterialInOutColumns()) {
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

/** 合计行跨列信息 */
export function getRmiFooterMeta(columns = flattenRmiColumns()) {
  const weightIdx = columns.findIndex((c) => c.field === 'weight')
  return {
    weightIdx,
    labelColspan: weightIdx,
    tailColspan: columns.length - weightIdx - 1,
    colCount: columns.length
  }
}

/** 分类行背景 */
export const CATEGORY_ROW_CLASS: Record<string, string> = {
  commercial: 'is-commercial',
  moto: 'is-moto',
  private: 'is-private'
}

/** 分类 Badge 样式 */
export const CATEGORY_BADGE_CLASS: Record<string, string> = {
  commercial: 'is-commercial',
  moto: 'is-moto',
  private: 'is-private'
}

export function buildMaterialInOutColumns() {
  return [
    {
      type: 'seq' as const,
      title: '序号',
      width: 50,
      headerClassName: 'rmi-head-base',
      className: 'rmi-cell-seq rmi-cell-sticky rmi-cell-sticky-seq',
      ...th
    },
    {
      field: 'date',
      title: '日期',
      width: 90,
      headerClassName: 'rmi-head-base rmi-head-sticky rmi-head-sticky-date',
      className: 'rmi-cell-sticky rmi-cell-sticky-date',
      slots: { default: 'date' },
      ...th
    },
    {
      field: 'internal_no',
      title: '厂内编号',
      width: 90,
      headerClassName: 'rmi-head-base',
      slots: { default: 'internal_no' },
      ...th
    },
    {
      field: 'category_label',
      title: '车辆分类',
      width: 80,
      headerClassName: 'rmi-head-base',
      slots: { default: 'category_label' },
      ...th
    },
    {
      field: 'vehicle_model',
      title: '车型',
      width: 120,
      headerClassName: 'rmi-head-base',
      ...th
    },
    {
      field: 'vin',
      title: '车架号',
      width: 160,
      headerClassName: 'rmi-head-base',
      slots: { default: 'vin' },
      ...th
    },
    {
      field: 'plate_no',
      title: '牌照号码',
      width: 100,
      headerClassName: 'rmi-head-base',
      slots: { default: 'plate_no' },
      ...th
    },
    {
      field: 'drive_type',
      title: '驱动类型',
      width: 80,
      headerClassName: 'rmi-head-base',
      slots: { default: 'drive_type' },
      ...th
    },
    {
      field: 'weight',
      title: '重量/吨',
      width: 80,
      headerClassName: 'rmi-head-weight',
      slots: { default: 'weight' },
      ...th
    },
    {
      field: 'owner',
      title: '车辆产权人',
      width: 160,
      headerClassName: 'rmi-head-base',
      slots: { default: 'owner' },
      ...th
    },
    {
      field: 'entry_no',
      title: '入库单号',
      width: 100,
      headerClassName: 'rmi-head-base',
      slots: { default: 'entry_no' },
      ...th
    },
    { field: 'salesman', title: '业务员', width: 80, headerClassName: 'rmi-head-base', ...th },
    { field: 'agent', title: '代理人', width: 80, headerClassName: 'rmi-head-base', ...th },
    { field: 'receiver', title: '领料人', width: 80, headerClassName: 'rmi-head-base', ...th },
    {
      field: 'supervision',
      title: '监销/非监销',
      width: 90,
      headerClassName: 'rmi-head-base',
      slots: { default: 'supervision' },
      ...th
    },
    {
      field: 'material_date',
      title: '领料日期',
      width: 90,
      headerClassName: 'rmi-head-base',
      slots: { default: 'material_date' },
      ...th
    },
    {
      field: 'cert_date',
      title: '领证日期',
      width: 90,
      headerClassName: 'rmi-head-base',
      slots: { default: 'cert_date' },
      ...th
    },
    {
      field: 'remark',
      title: '备注',
      width: 90,
      headerClassName: 'rmi-head-base',
      slots: { default: 'remark' },
      ...th
    }
  ]
}

/** 驱动类型 Badge 样式 */
export function driveTypeClass(type?: string) {
  if (type === '纯电') return 'is-ev'
  if (type === '混动') return 'is-hybrid'
  return 'is-fuel'
}
