import { h } from 'vue'
import type { ColumnOption } from '@/types/component'
import type { ScrapVehicle } from '@/types/recycle/recovery/vehicles/vehicle'
import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

/** 列表页表格操作回调。 */
export interface VehicleColumnActions {
  /** 打开车辆详情弹窗。 */
  openDetail: (row: ScrapVehicle) => void
  /** 打开档案编辑弹窗。 */
  openEdit: (row: ScrapVehicle) => void
  /** 打开关联订单弹窗。 */
  openLinkOrder: (row: ScrapVehicle) => void
  /** 打开关联回收订单详情。 */
  openOrderDetail: (row: ScrapVehicle) => void
  /** 下载回收证明。 */
  downloadCert: (row: ScrapVehicle) => void
  /** 软删除车辆档案。 */
  softDelete: (row: ScrapVehicle) => void
}

const textOr = (value: unknown, fallback = '—') => (value ? String(value) : fallback)

const linkButton = (text: string, onClick: () => void) =>
  h('a', { href: 'javascript:void(0)', class: 'order-no', onClick }, text)

const actionButton = (cls: string, icon: string, label: string, onClick: () => void) =>
  h('button', { type: 'button', class: `order-action-btn ${cls}`, onClick }, [
    h(ArtSvgIcon, { icon, class: 'order-action-icon' }),
    label
  ])

/** 三维度状态列：拖车 / 入厂 / 注销。 */
function renderDimStatus(row: ScrapVehicle) {
  const dim = row.dim_status
  if (!dim) return h('span', { class: 'text-gray-400' }, textOr(row.status_text))
  const items = [
    { key: 'tow', icon: 'ri:truck-line', data: dim.tow },
    { key: 'factory', icon: 'ri:box-3-line', data: dim.factory },
    { key: 'cancel', icon: 'ri:file-list-3-line', data: dim.cancel }
  ]
  return h(
    'div',
    { class: 'vehicle-dim-status' },
    items.map((item) =>
      h('div', { class: 'vehicle-dim-row', key: item.key }, [
        h(ArtSvgIcon, { icon: item.icon, class: 'vehicle-dim-icon' }),
        h(
          'span',
          {
            class: 'vehicle-dim-badge',
            style: {
              color: item.data?.color || '#8C8C8C',
              background: item.data?.bg || '#F5F5F5'
            }
          },
          item.data?.label || '—'
        )
      ])
    )
  )
}

/** 关联订单列：已关联展示单号+修改，待补关联展示警示+补充按钮。 */
function renderLinkedOrderCell(row: ScrapVehicle, actions: VehicleColumnActions) {
  if (row.order_no || row.order_id) {
    return h('div', { class: 'vehicle-order-cell' }, [
      linkButton(row.order_no || '—', () => actions.openOrderDetail(row)),
      h(
        'button',
        {
          type: 'button',
          class: 'vehicle-order-modify-btn',
          onClick: () => actions.openLinkOrder(row)
        },
        '修改'
      )
    ])
  }
  if (!row.order_id && !row.order_no) {
    return h('div', { class: 'vehicle-order-cell pending' }, [
      h('span', { class: 'vehicle-pending-link-tag' }, [
        h(ArtSvgIcon, { icon: 'ri:error-warning-line', class: 'vehicle-pending-link-icon' }),
        '待补关联订单'
      ]),
      h(
        'button',
        {
          type: 'button',
          class: 'vehicle-link-order-btn',
          onClick: () => actions.openLinkOrder(row)
        },
        '补充关联订单'
      )
    ])
  }
  return h('span', { class: 'text-gray-400' }, '—')
}

/** 车辆档案列表页表格列定义。 */
export function buildVehicleColumns(actions: VehicleColumnActions): ColumnOption<ScrapVehicle>[] {
  return [
    {
      prop: 'vehicle_no',
      label: '档案号',
      minWidth: 120,
      formatter: (row) =>
        linkButton(row.vehicle_no || row.archive_no || '—', () => actions.openDetail(row))
    },
    {
      prop: 'plate_no',
      label: '车牌号',
      minWidth: 110,
      formatter: (row) => textOr(row.plate_no)
    },
    {
      prop: 'brand_model',
      label: '品牌车型',
      minWidth: 140,
      formatter: (row) => row.brand_model || [row.brand, row.model].filter(Boolean).join(' ') || '—'
    },
    {
      prop: 'vehicle_type_text',
      label: '车辆类型',
      minWidth: 100,
      formatter: (row) => textOr(row.vehicle_type_text || row.fuel_type_text)
    },
    {
      prop: 'owner_display',
      label: '车主信息',
      minWidth: 140,
      formatter: (row) =>
        h('div', { class: 'vehicle-owner-cell' }, [
          h('div', { class: 'vehicle-owner-name' }, row.owner_name || row.owner_display || '—'),
          h('div', { class: 'vehicle-owner-phone' }, row.owner_phone || '')
        ])
    },
    {
      prop: 'dim_status',
      label: '三维度状态',
      minWidth: 140,
      formatter: (row) => renderDimStatus(row)
    },
    {
      prop: 'order_no',
      label: '关联订单',
      minWidth: 150,
      formatter: (row) => renderLinkedOrderCell(row, actions)
    },
    {
      prop: 'update_time_text',
      label: '最后更新',
      minWidth: 140,
      formatter: (row) => textOr(row.update_time_text || row.add_time_text)
    },
    {
      prop: 'operation',
      label: '操作',
      width: 400,
      align: 'center',
      fixed: 'right',
      formatter: (row) => {
        const buttons = [
          actionButton('default', 'ri:eye-line', '查看', () => actions.openDetail(row)),
          actionButton('primary', 'ri:edit-line', '编辑档案', () => actions.openEdit(row))
        ]
        if (row.owner_sync_djid) {
          buttons.push(
            actionButton('default', 'ri:download-line', '下载证明', () => actions.downloadCert(row))
          )
        }
        buttons.push(
          actionButton('danger', 'ri:delete-bin-line', '删除', () => actions.softDelete(row))
        )
        return h('div', { class: 'order-actions' }, buttons)
      }
    }
  ]
}
