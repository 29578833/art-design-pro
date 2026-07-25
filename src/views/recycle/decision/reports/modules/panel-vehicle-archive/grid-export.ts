import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import { fetchVehicleArchive } from '@/api/recycle/report'
import type {
  VehicleArchiveCarItem,
  VehicleArchiveMotoItem,
  VehicleArchiveParams
} from '@/types/recycle/decision/reports/report'
import { CAR_PROGRESS_STEPS } from './grid-columns'

/** 导出参数（已有列表数据） */
export interface VehicleArchiveExportOptions {
  /** 车型：car/moto */
  type: 'car' | 'moto'
  /** 开始日期 */
  startDate: string
  /** 结束日期 */
  endDate: string
  /** 数据列表 */
  list: VehicleArchiveCarItem[] | VehicleArchiveMotoItem[]
}

/** 拉取并导出参数 */
export interface VehicleArchiveExportReportParams {
  /** 车型：car/moto，默认 car */
  type?: 'car' | 'moto'
  /** 开始日期 */
  startDate: string
  /** 结束日期 */
  endDate: string
  /** 关键词 */
  keyword?: string
  /** 进度步骤筛选（仅汽车） */
  progress_status?: string
}

/** 报表标题 */
export function getVehicleArchiveReportTitle(type: 'car' | 'moto') {
  return type === 'car'
    ? '鑫广再生资源（上海）有限公司报废汽车（乘用车和商用车）信息汇总表'
    : '鑫广再生资源（上海）有限公司轻摩摩托车信息汇总表'
}

const CAR_HEADERS = [
  '序号',
  '自编号',
  '进车/入库日期',
  '业务员',
  '代理人',
  '电话号码',
  '车辆产权人',
  '车型',
  '品牌',
  '号牌号码',
  '车架号',
  '发动机号',
  '颜色',
  '类别',
  '使用性质',
  '整备质量',
  '实际重量',
  '结算重量',
  '监销/非监销',
  '正常/非正常',
  '运输方式',
  ...CAR_PROGRESS_STEPS.map((s) => s.label),
  '备注'
]

const MOTO_HEADERS = [
  '序号',
  '自编号',
  '入库日期',
  '车辆产权人',
  '业务员',
  '代理人',
  '电话号码',
  '号牌号码',
  '整备质量',
  '中心结算吨位',
  '实际吨位',
  '品牌',
  '车型',
  '使用性质',
  '颜色',
  '车架号',
  '发动机号',
  '区域',
  '报送材料日期',
  '办证完成日期',
  '备注'
]

function buildCarBody(list: VehicleArchiveCarItem[]) {
  return list.map((row, i) => [
    i + 1,
    row.self_no,
    row.entry_date,
    row.salesman,
    row.agent,
    row.phone,
    row.owner,
    row.vehicle_type,
    row.brand,
    row.plate_no,
    row.vin,
    row.engine_no,
    row.color,
    row.category,
    row.usage_nature,
    row.curb_weight,
    row.actual_weight,
    row.settle_weight,
    row.supervision,
    row.abnormal,
    row.transport,
    ...CAR_PROGRESS_STEPS.map((s) => row.progress?.[s.field] || ''),
    row.remark
  ])
}

function buildMotoBody(list: VehicleArchiveMotoItem[]) {
  return list.map((row, i) => [
    i + 1,
    row.self_no,
    row.entry_date,
    row.owner,
    row.salesman,
    row.agent,
    row.phone,
    row.plate_no,
    row.curb_weight,
    row.settle_weight,
    row.actual_weight,
    row.brand,
    row.vehicle_type,
    row.usage_nature,
    row.color,
    row.vin,
    row.engine_no,
    row.area,
    row.material_date,
    row.cert_date,
    row.remark
  ])
}

function writeSheet(
  title: string,
  startDate: string,
  endDate: string,
  hdr: string[],
  body: unknown[][]
) {
  const ws = XLSX.utils.aoa_to_sheet([
    [title],
    [`查询区间：${startDate} — ${endDate}`],
    hdr,
    ...body
  ])
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: hdr.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: hdr.length - 1 } }
  ]
  ws['!cols'] = hdr.map(() => ({ wch: 12 }))
  return ws
}

/**
 * 导出车辆档案信息汇总表 Excel（纯函数，不含接口请求）
 * @returns 是否有数据并成功导出
 */
export function exportVehicleArchiveExcel(options: VehicleArchiveExportOptions): boolean {
  const { type, startDate, endDate, list } = options
  if (!list.length) return false

  const title = getVehicleArchiveReportTitle(type)

  if (type === 'car') {
    const ws = writeSheet(
      title,
      startDate,
      endDate,
      CAR_HEADERS,
      buildCarBody(list as VehicleArchiveCarItem[])
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '汽车信息汇总')
    XLSX.writeFile(wb, `汽车档案信息汇总_${startDate}_${endDate}.xlsx`)
  } else {
    const ws = writeSheet(
      title,
      startDate,
      endDate,
      MOTO_HEADERS,
      buildMotoBody(list as VehicleArchiveMotoItem[])
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '轻摩信息汇总')
    XLSX.writeFile(wb, `轻摩档案信息汇总_${startDate}_${endDate}.xlsx`)
  }

  return true
}

/** 车辆档案信息汇总表导出 Hook */
export function useVehicleArchiveExport() {
  const exporting = ref(false)

  /** 拉取全量数据并导出 */
  async function exportReport(params: VehicleArchiveExportReportParams): Promise<boolean> {
    const type = params.type || 'car'
    exporting.value = true
    try {
      const query: VehicleArchiveParams = {
        type,
        start_date: params.startDate,
        end_date: params.endDate,
        keyword: params.keyword || '',
        progress_status: params.progress_status || '',
        page: 1,
        limit: 9999
      }
      const res = await fetchVehicleArchive(query)
      const ok = exportVehicleArchiveExcel({
        type,
        startDate: params.startDate,
        endDate: params.endDate,
        list: res.list || []
      })
      if (!ok) {
        ElMessage.warning('暂无数据可导出')
        return false
      }
      ElMessage.success('导出成功')
      return true
    } finally {
      exporting.value = false
    }
  }

  /** 直接导出已有列表（不请求接口） */
  function exportFromList(options: VehicleArchiveExportOptions): boolean {
    const ok = exportVehicleArchiveExcel(options)
    if (!ok) {
      ElMessage.warning('暂无数据可导出')
      return false
    }
    ElMessage.success('导出成功')
    return true
  }

  return {
    exporting,
    exportReport,
    exportFromList,
    getVehicleArchiveReportTitle
  }
}
