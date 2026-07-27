/** 财务结算申请表 vxe-grid 列配置 */

export const FS_SUM_FIELDS = [
  'weight',
  'actual_scale',
  'transport_subsidy_amt',
  'vehicle_count',
  'contract_amt',
  'payable_amt',
  'cash_pay_amt',
  'service_fee_total',
  'regular_fee_total',
  'year_total_amt',
  'grand_total',
  'other_fee'
] as const

export type FsSumField = (typeof FS_SUM_FIELDS)[number]

export function parseFsNumber(val?: string | number) {
  if (val === '' || val === null || val === undefined || val === '—' || val === '--') return 0
  const n = Number(String(val).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function fmtFsAmt(val?: string | number) {
  const n = parseFsNumber(val)
  return n ? n.toLocaleString() : '—'
}

export function fmtFsText(val?: string | number | null) {
  if (val === null || val === undefined || val === '' || val === '--') return '—'
  return String(val)
}

export function buildFinanceSettlementColumns() {
  const th = { align: 'center' as const, headerAlign: 'center' as const }

  const leaf = (
    field: string,
    title: string,
    minWidth: number,
    groupClass: string,
    cellClass: string,
    opts?: { fixed?: 'left' | 'right'; slot?: boolean }
  ) => ({
    field,
    title,
    minWidth,
    headerClassName: groupClass,
    className: cellClass,
    ...(opts?.slot ? { slots: { default: field } } : {}),
    ...(opts?.fixed ? { fixed: opts.fixed } : {}),
    ...th
  })

  const leftFixed = { fixed: 'left' as const, slot: true as const }

  return [
    leaf('row_no', '行号', 48, 'fs-head-base', 'fs-cell-seq', leftFixed),
    leaf('vehicle_no', '自编号', 110, 'fs-head-base', '', leftFixed),
    leaf('my_vehicle_model', '我司车型', 90, 'fs-head-base', '', leftFixed),
    leaf('vehicle_class', '车辆承类', 80, 'fs-head-base', '', { slot: true }),
    {
      title: '时间 / 单号',
      headerClassName: 'fs-group-time',
      children: [
        leaf('entry_date', '录入日期', 96, 'fs-leaf-time', 'fs-col-time', { slot: true }),
        leaf('warehouse_date', '入库日期', 96, 'fs-leaf-time', 'fs-col-time', { slot: true }),
        leaf('warehouse_no', '入库单号', 120, 'fs-leaf-time', 'fs-col-time', { slot: true })
      ]
    },
    {
      title: '产权人信息',
      headerClassName: 'fs-group-owner',
      children: [
        leaf('owner_name', '车辆产权人', 100, 'fs-leaf-owner', 'fs-col-owner', { slot: true }),
        leaf('owner_id_number', '身份证/机构代码', 140, 'fs-leaf-owner', 'fs-col-owner', {
          slot: true
        }),
        leaf('owner_address', '车主户口', 100, 'fs-leaf-owner', 'fs-col-owner', { slot: true }),
        leaf('owner_bank_card', '车主银行卡号', 140, 'fs-leaf-owner', 'fs-col-owner', {
          slot: true
        }),
        leaf('archive_no', '车辆档案单号', 120, 'fs-leaf-owner', 'fs-col-owner', { slot: true }),
        leaf('order_no', '回收订单号', 120, 'fs-leaf-owner', 'fs-col-owner', { slot: true })
      ]
    },
    {
      title: '代理人信息',
      headerClassName: 'fs-group-agent',
      children: [
        leaf('agent_name', '代理人', 80, 'fs-leaf-agent', 'fs-col-agent', { slot: true }),
        leaf('agent_id_number', '代理人身份证', 130, 'fs-leaf-agent', 'fs-col-agent', {
          slot: true
        }),
        leaf('agent_phone', '代理人手机号', 110, 'fs-leaf-agent', 'fs-col-agent', { slot: true }),
        leaf('agent_contact', '联系电话', 110, 'fs-leaf-agent', 'fs-col-agent', { slot: true }),
        leaf('agent_address', '代理人户口', 100, 'fs-leaf-agent', 'fs-col-agent', { slot: true }),
        leaf('agent_bank_card', '代理人银行卡号', 140, 'fs-leaf-agent', 'fs-col-agent', {
          slot: true
        })
      ]
    },
    {
      title: '车辆标识',
      headerClassName: 'fs-group-vehicle',
      children: [
        leaf('plate_no', '车牌号', 90, 'fs-leaf-vehicle', 'fs-col-vehicle', { slot: true }),
        leaf('vin', '车架号', 140, 'fs-leaf-vehicle', 'fs-col-vehicle', { slot: true }),
        leaf('engine_no', '发动机号', 110, 'fs-leaf-vehicle', 'fs-col-vehicle', { slot: true }),
        leaf('brand', '品牌型号', 110, 'fs-leaf-vehicle', 'fs-col-vehicle', { slot: true })
      ]
    },
    {
      title: '规格重量',
      headerClassName: 'fs-group-spec',
      children: [
        leaf('vehicle_type_text', '车辆类型', 100, 'fs-leaf-spec', 'fs-col-spec', { slot: true }),
        leaf('weight', '重量(吨)', 70, 'fs-leaf-spec', 'fs-col-spec', { slot: true })
      ]
    },
    {
      title: '磅位',
      headerClassName: 'fs-group-scale',
      children: [
        leaf('scale_diff', '磅差位置', 70, 'fs-leaf-scale', 'fs-col-scale', { slot: true }),
        leaf('actual_scale', '实际磅位', 70, 'fs-leaf-scale', 'fs-col-scale', { slot: true })
      ]
    },
    {
      title: '施车补贴',
      headerClassName: 'fs-group-subsidy',
      children: [
        leaf('transport_subsidy', '补贴(元/吨)', 80, 'fs-leaf-subsidy', 'fs-col-subsidy', {
          slot: true
        }),
        leaf('transport_subsidy_amt', '补贴金额(元)', 90, 'fs-leaf-subsidy', 'fs-col-subsidy', {
          slot: true
        })
      ]
    },
    {
      title: '道路运费',
      headerClassName: 'fs-group-freight',
      children: [
        leaf('freight_category', '运费类目', 80, 'fs-leaf-freight', 'fs-col-freight', {
          slot: true
        }),
        leaf('freight_per_ton', '运费(元/吨)', 90, 'fs-leaf-freight', 'fs-col-freight', {
          slot: true
        })
      ]
    },
    {
      title: '结算价格',
      headerClassName: 'fs-group-settle',
      children: [
        leaf('settlement_category', '结算类目', 90, 'fs-leaf-settle', 'fs-col-settle', {
          slot: true
        }),
        leaf('settlement_price', '结算价(元/吨)', 90, 'fs-leaf-settle', 'fs-col-settle', {
          slot: true
        }),
        leaf('vehicle_count', '车辆数', 70, 'fs-leaf-settle', 'fs-col-settle', { slot: true })
      ]
    },
    {
      title: '竞价合同',
      headerClassName: 'fs-group-contract',
      children: [
        leaf('bidding_contract', '竞价合同', 80, 'fs-leaf-contract', 'fs-col-contract', {
          slot: true
        }),
        leaf('contract_amt', '合同金额(元)', 90, 'fs-leaf-contract', 'fs-col-contract', {
          slot: true
        })
      ]
    },
    leaf('payable_amt', '应付金额(元)', 100, 'fs-head-payable', 'fs-col-payable', { slot: true }),
    leaf('cash_pay_amt', '现金支付(元)', 90, 'fs-head-base', '', { slot: true }),
    {
      title: '服务费',
      headerClassName: 'fs-group-service',
      children: [
        leaf('service_fee_category', '服务费类目', 80, 'fs-leaf-service', 'fs-col-service', {
          slot: true
        }),
        leaf('service_fee_per_ton', '服务费(元/吨)', 90, 'fs-leaf-service', 'fs-col-service', {
          slot: true
        }),
        leaf('service_fee_total', '服务费合计(元)', 90, 'fs-leaf-service', 'fs-col-service', {
          slot: true
        })
      ]
    },
    leaf('regular_fee_total', '正规费合计(元)', 90, 'fs-head-base', '', { slot: true }),
    leaf('year_total_amt', '本年总金额(元)', 100, 'fs-head-year', 'fs-col-year', { slot: true }),
    leaf('grand_total', '合计(元)', 90, 'fs-head-base', '', { slot: true }),
    leaf('remark', '备注(业务员)', 90, 'fs-head-base', '', { slot: true }),
    leaf('settlement_no', '结算单号', 120, 'fs-head-base', '', { slot: true }),
    leaf('other_fee', '其他费用', 80, 'fs-head-base', '', { slot: true }),
    leaf('branch_office', '分公司', 80, 'fs-head-base', '', { slot: true })
  ]
}

type FsColumn = ReturnType<typeof buildFinanceSettlementColumns>[number]

/** 展平二级叶子列 */
export function flattenFsColumns(columns: FsColumn[] = buildFinanceSettlementColumns()) {
  const leaf: { field?: string }[] = []
  columns.forEach((col) => {
    if ('children' in col && Array.isArray(col.children) && col.children.length) {
      col.children.forEach((child) => {
        leaf.push({ field: child.field })
      })
    } else {
      leaf.push({ field: (col as { field?: string }).field })
    }
  })
  return leaf
}

/** 合计行左侧合并列数（按二级表头计） */
export const FS_FOOTER_LABEL_COLSPAN = 3

/** 左侧固定列数，与合计合并列一致 */
export const FS_FIXED_COL_COUNT = FS_FOOTER_LABEL_COLSPAN

/** 是否为左侧固定区 footer（vxe 固定列与滚动列 footer 分开渲染） */
export function isFsFixedFooterColumns(columns: { field?: string }[]) {
  return columns.length === FS_FIXED_COL_COUNT && columns[0]?.field === 'row_no'
}
