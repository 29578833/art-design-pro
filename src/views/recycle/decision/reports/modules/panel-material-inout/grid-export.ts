import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import { fetchMaterialInOut } from '@/api/recycle/report'
import type {
  MaterialInOutItem,
  MaterialInOutParams,
  MaterialInOutStats
} from '@/types/recycle/decision/reports/report'

export const RMI_REPORT_TITLE = '报废车辆（商用车、轻摩、私家车）出入库清单'

const HEADERS = [
  '日期',
  '厂内编号',
  '车辆分类',
  '车型',
  '车架号',
  '牌照号码',
  '驱动类型',
  '重量/吨',
  '车辆产权人',
  '入库单号',
  '业务员',
  '代理人',
  '领料人',
  '监销/非监销',
  '领料日期',
  '领证日期',
  '备注'
]

function buildBody(list: MaterialInOutItem[]) {
  return list.map((row) => [
    row.date,
    row.internal_no,
    row.category_label,
    row.vehicle_model,
    row.vin,
    row.plate_no,
    row.drive_type,
    row.weight,
    row.owner,
    row.entry_no,
    row.salesman,
    row.agent,
    row.receiver,
    row.supervision || '/',
    row.material_date,
    row.cert_date,
    row.remark
  ])
}

function calcTotalWeight(stats?: MaterialInOutStats) {
  if (!stats) return '0.000'
  const sum =
    Number(stats.commercialWeight || 0) +
    Number(stats.motoWeight || 0) +
    Number(stats.privateWeight || 0)
  return sum.toFixed(3)
}

export interface RmiExportOptions {
  startDate: string
  endDate: string
  list: MaterialInOutItem[]
  stats?: MaterialInOutStats
  count?: number
}

function buildFooterSummary(count: number, stats?: MaterialInOutStats) {
  return `合计 ${count} 辆  商用车:${stats?.commercial ?? 0}辆  轻摩:${stats?.moto ?? 0}辆  私家车:${stats?.private ?? 0}辆`
}

export function exportMaterialInOutExcel(options: RmiExportOptions): boolean {
  const { startDate, endDate, list, stats, count = list.length } = options
  if (!list.length) return false

  const footerRow = HEADERS.map(() => '')
  footerRow[0] = buildFooterSummary(count, stats)
  footerRow[7] = calcTotalWeight(stats)

  const ws = XLSX.utils.aoa_to_sheet([
    [RMI_REPORT_TITLE],
    [`查询区间：${startDate} — ${endDate}`],
    HEADERS,
    ...buildBody(list),
    footerRow
  ])
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: HEADERS.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: HEADERS.length - 1 } }
  ]
  ws['!cols'] = HEADERS.map((_, i) => ({ wch: i === 8 ? 20 : i === 4 ? 18 : 12 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '出入库清单')
  XLSX.writeFile(wb, `原料出入库清单_${startDate}_${endDate}.xlsx`)
  return true
}

/** 原料出入库清单导出 Hook */
export function useMaterialInOutExport() {
  const exporting = ref(false)

  async function exportReport(
    params: MaterialInOutParams & { startDate: string; endDate: string }
  ) {
    exporting.value = true
    try {
      const res = await fetchMaterialInOut({
        ...params,
        start_date: params.startDate,
        end_date: params.endDate,
        page: 1,
        limit: 9999
      })
      const ok = exportMaterialInOutExcel({
        startDate: params.startDate,
        endDate: params.endDate,
        list: res.list || [],
        stats: res.stats,
        count: res.count
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

  return { exporting, exportReport, exportMaterialInOutExcel }
}
