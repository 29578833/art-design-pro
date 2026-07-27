/** 机动车报废拆解清单 vxe-grid 列配置 */

import type { PhotoChecklistField } from '@/types/recycle/decision/reports/report'

export const PHOTO_COLS: { key: PhotoChecklistField; label: string; color: string }[] = [
  { key: 'photo_frame1', label: '车架照', color: '#73D13D' },
  { key: 'photo_frame2', label: '车架照②', color: '#95DE64' },
  { key: 'photo_engine', label: '发动机照', color: '#D3ADF7' },
  { key: 'photo_transmission', label: '变速器照', color: '#87E8DE' },
  { key: 'photo_steering', label: '方向器照', color: '#FFD591' },
  { key: 'photo_front_axle', label: '前桥照', color: '#FFA940' },
  { key: 'photo_rear_axle', label: '后桥照', color: '#FF7875' },
  { key: 'photo_stamp', label: '钢印部照片', color: '#BAE7FF' },
  { key: 'photo_battery', label: '动力电池', color: '#52C41A' }
]

export function buildPhotoChecklistColumns() {
  const th = { align: 'center' as const, headerAlign: 'center' as const }
  return [
    {
      type: 'seq',
      title: '序号',
      width: 52,
      fixed: 'left' as const,
      className: 'pc-cell-seq pc-sticky',
      headerClassName: 'pc-head-base',
      ...th
    },
    {
      field: 'plate_no',
      title: '车牌号',
      width: 100,
      fixed: 'left' as const,
      className: 'pc-sticky',
      headerClassName: 'pc-head-base',
      slots: { default: 'plate_no' },
      ...th
    },
    {
      field: 'dismantle_date',
      title: '拆解日期',
      minWidth: 100,
      headerClassName: 'pc-head-base',
      ...th
    },
    {
      field: 'roof_cut_time',
      title: '掀顶/断粱时间',
      minWidth: 140,
      headerClassName: 'pc-head-base',
      ...th
    },
    {
      field: 'assembly_dismantle_time',
      title: '五大总成拆解时间',
      minWidth: 150,
      headerClassName: 'pc-head-base',
      ...th
    },
    {
      field: 'uploaded',
      title: '已传/总数',
      width: 80,
      headerClassName: 'pc-head-count',
      className: 'pc-col-count',
      slots: { default: 'uploaded' },
      ...th
    },
    ...PHOTO_COLS.map((col) => ({
      field: col.key,
      title: col.label,
      width: 92,
      headerClassName: 'pc-head-photo',
      className: 'pc-col-photo',
      slots: { default: col.key },
      ...th
    })),
    {
      field: 'action',
      title: '操作',
      width: 100,
      fixed: 'right' as const,
      headerClassName: 'pc-head-base',
      slots: { default: 'action' },
      ...th
    }
  ]
}
