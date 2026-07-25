/** 车辆档案汇总表 vxe-grid 列配置 */

const th = { align: 'center' as const, headerAlign: 'center' as const }

/** 汽车进度步骤（表格列 / 导出列共用） */
export const CAR_PROGRESS_STEPS = [
  { field: 'info_entry', label: '信息录入' },
  { field: 'inspect_warehousing', label: '查验入库' },
  { field: 'dismantle', label: '拆解' },
  { field: 'submit_review', label: '送审' },
  { field: 'certificate', label: '办证' },
  { field: 'get_certificate', label: '领证' },
  { field: 'payment_request', label: '请款' }
] as const

/** 汽车表格列（双行表头） */
export function buildCarColumns() {
  return [
    {
      type: 'seq' as const,
      title: '序号',
      width: 50,
      fixed: 'left' as const,
      headerClassName: 'va-leaf-seq',
      ...th
    },
    {
      field: 'self_no',
      title: '自编号',
      width: 100,
      fixed: 'left' as const,
      headerClassName: 'va-leaf-seq',
      slots: { default: 'self_no' },
      ...th
    },
    {
      field: 'entry_date',
      title: '进车/入库日期',
      width: 110,
      headerClassName: 'va-leaf-seq',
      ...th
    },
    {
      title: '业务信息',
      headerClassName: 'va-group-biz',
      children: [
        { field: 'salesman', title: '业务员', width: 76, headerClassName: 'va-leaf-biz', ...th },
        { field: 'agent', title: '代理人', width: 76, headerClassName: 'va-leaf-biz', ...th },
        { field: 'phone', title: '电话号码', width: 118, headerClassName: 'va-leaf-biz', ...th }
      ]
    },
    {
      title: '车辆信息',
      headerClassName: 'va-group-vehicle',
      children: [
        {
          field: 'owner',
          title: '车辆产权人',
          width: 100,
          headerClassName: 'va-leaf-vehicle',
          ...th
        },
        {
          field: 'vehicle_type',
          title: '车型',
          width: 110,
          headerClassName: 'va-leaf-vehicle',
          ...th
        },
        { field: 'brand', title: '品牌', width: 90, headerClassName: 'va-leaf-vehicle', ...th },
        {
          field: 'plate_no',
          title: '号牌号码',
          width: 100,
          headerClassName: 'va-leaf-vehicle',
          slots: { default: 'plate_no' },
          ...th
        },
        {
          field: 'vin',
          title: '车架号',
          width: 160,
          headerClassName: 'va-leaf-vehicle',
          slots: { default: 'vin' },
          ...th
        },
        {
          field: 'engine_no',
          title: '发动机号',
          width: 110,
          headerClassName: 'va-leaf-vehicle',
          ...th
        },
        { field: 'color', title: '颜色', width: 70, headerClassName: 'va-leaf-vehicle', ...th },
        {
          field: 'category',
          title: '类别',
          width: 80,
          headerClassName: 'va-leaf-vehicle',
          slots: { default: 'category' },
          ...th
        },
        {
          field: 'usage_nature',
          title: '使用性质',
          width: 80,
          headerClassName: 'va-leaf-vehicle',
          ...th
        }
      ]
    },
    {
      title: '重量/吨',
      headerClassName: 'va-group-weight',
      children: [
        {
          field: 'curb_weight',
          title: '整备质量',
          width: 86,
          headerClassName: 'va-leaf-weight',
          ...th
        },
        {
          field: 'actual_weight',
          title: '实际重量',
          width: 86,
          headerClassName: 'va-leaf-weight',
          ...th
        },
        {
          field: 'settle_weight',
          title: '结算重量',
          width: 86,
          headerClassName: 'va-leaf-weight',
          ...th
        }
      ]
    },
    {
      title: '报废形式',
      headerClassName: 'va-group-scrap',
      children: [
        {
          field: 'supervision',
          title: '监销/非监销',
          width: 100,
          headerClassName: 'va-leaf-scrap',
          slots: { default: 'supervision' },
          ...th
        },
        {
          field: 'abnormal',
          title: '正常/非正常',
          width: 100,
          headerClassName: 'va-leaf-scrap',
          slots: { default: 'abnormal' },
          ...th
        }
      ]
    },
    { field: 'transport', title: '运输方式', width: 80, headerClassName: 'va-leaf-seq', ...th },
    {
      title: '进度/状态（日期）',
      headerClassName: 'va-group-progress',
      children: CAR_PROGRESS_STEPS.map((step) => ({
        field: `progress_${step.field}`,
        title: step.label,
        width: 72,
        headerClassName: 'va-leaf-progress',
        slots: { default: `progress_${step.field}` },
        ...th
      }))
    },
    { field: 'remark', title: '备注', width: 100, headerClassName: 'va-leaf-seq', ...th }
  ]
}

/** 摩托车表格列（单行表头，对齐原型） */
export function buildMotoColumns() {
  return [
    {
      type: 'seq' as const,
      title: '序号',
      width: 50,
      fixed: 'left' as const,
      headerClassName: 'va-moto-sticky',
      ...th
    },
    {
      field: 'self_no',
      title: '自编号',
      width: 100,
      fixed: 'left' as const,
      headerClassName: 'va-moto-sticky',
      slots: { default: 'self_no_moto' },
      ...th
    },
    {
      field: 'entry_date',
      title: '入库日期',
      width: 100,
      headerClassName: 'va-moto-sticky',
      ...th
    },
    { field: 'owner', title: '车辆产权人', width: 100, headerClassName: 'va-moto-sticky', ...th },
    { field: 'salesman', title: '业务员', width: 80, headerClassName: 'va-moto-sticky', ...th },
    { field: 'agent', title: '代理人', width: 80, headerClassName: 'va-moto-sticky', ...th },
    { field: 'phone', title: '电话号码', width: 118, headerClassName: 'va-moto-sticky', ...th },
    { field: 'plate_no', title: '号牌号码', width: 100, headerClassName: 'va-moto-sticky', ...th },
    {
      field: 'curb_weight',
      title: '整备质量',
      width: 86,
      headerClassName: 'va-moto-weight',
      ...th
    },
    {
      field: 'settle_weight',
      title: '中心结算吨位',
      width: 100,
      headerClassName: 'va-moto-weight',
      ...th
    },
    {
      field: 'actual_weight',
      title: '实际吨位',
      width: 86,
      headerClassName: 'va-moto-weight',
      ...th
    },
    { field: 'brand', title: '品牌', width: 90, headerClassName: 'va-moto-vehicle', ...th },
    { field: 'vehicle_type', title: '车型', width: 110, headerClassName: 'va-moto-vehicle', ...th },
    {
      field: 'usage_nature',
      title: '使用性质',
      width: 80,
      headerClassName: 'va-moto-vehicle',
      ...th
    },
    { field: 'color', title: '颜色', width: 70, headerClassName: 'va-moto-vehicle', ...th },
    {
      field: 'vin',
      title: '车架号',
      width: 160,
      headerClassName: 'va-moto-vehicle',
      slots: { default: 'vin' },
      ...th
    },
    {
      field: 'engine_no',
      title: '发动机号',
      width: 110,
      headerClassName: 'va-moto-vehicle',
      ...th
    },
    { field: 'area', title: '区域', width: 80, headerClassName: 'va-moto-flow', ...th },
    {
      field: 'material_date',
      title: '报送材料日期',
      width: 110,
      headerClassName: 'va-moto-flow',
      slots: { default: 'material_date' },
      ...th
    },
    {
      field: 'cert_date',
      title: '办证完成日期',
      width: 110,
      headerClassName: 'va-moto-flow',
      slots: { default: 'cert_date' },
      ...th
    },
    { field: 'remark', title: '备注', width: 100, headerClassName: 'va-moto-sticky', ...th }
  ]
}
