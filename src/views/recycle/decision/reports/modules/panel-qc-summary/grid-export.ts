import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import { fetchQualityInspection } from '@/api/recycle/report'
import type {
  QualityInspectionItem,
  QualityInspectionParams
} from '@/types/recycle/decision/reports/report'
import { deliveryTypeText, formatCollectDate, getQcFooterMeta, ownerTypeText } from './grid-columns'

export const QC_REPORT_TITLE = '鑫广再生资源（上海）有限公司 · 报废车辆质检汇总表'

const HEADERS = [
  '序号',
  '车辆档案号',
  '收车日期',
  '自编号',
  '车牌号',
  '质检状态',
  '私家车/非私家车',
  '排量（排放标准）',
  '车型',
  '号牌（牌照）',
  '车主',
  '业务员',
  '代理人',
  '拖车/自送',
  '拖车号码/驾驶员',
  '驱动类型',
  '磅重/kg',
  '电瓶',
  '三元催化',
  '杂件/缺件扣款',
  '质检单号',
  '质检员'
]

function buildBody(list: QualityInspectionItem[]) {
  return list.map((row, i) => [
    i + 1,
    row.vehicle_no,
    row.collect_date ? formatCollectDate(row.collect_date) : row.collect_date,
    row.self_no,
    row.plate_no,
    row.qc_status_text,
    ownerTypeText(row.owner_type),
    row.emission_standard,
    row.vehicle_type_text,
    row.plate_status,
    row.owner_name,
    row.business_name,
    row.agent_name,
    deliveryTypeText(row.delivery_type),
    row.driver_name,
    row.fuel_type_text,
    row.weight,
    row.battery_status,
    row.catalyst_status,
    row.deduction,
    row.check_no,
    row.inspector_name
  ])
}

export interface QcExportOptions {
  startDate: string
  endDate: string
  list: QualityInspectionItem[]
}

export function exportQualityInspectionExcel(options: QcExportOptions): boolean {
  const { startDate, endDate, list } = options
  if (!list.length) return false

  const totalWeight = list.reduce((sum, row) => sum + Number(row.weight || 0), 0)
  const { weightIdx, tailColspan } = getQcFooterMeta()
  const footerRow: (string | number)[] = []
  footerRow[0] = `合计（${list.length} 辆）：`
  footerRow[weightIdx] = totalWeight.toFixed(2)
  if (tailColspan > 0) footerRow[weightIdx + 1] = ''

  const ws = XLSX.utils.aoa_to_sheet([
    [QC_REPORT_TITLE],
    [`查询区间：${startDate} — ${endDate}`],
    HEADERS,
    ...buildBody(list),
    footerRow
  ])
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: HEADERS.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: HEADERS.length - 1 } }
  ]
  ws['!cols'] = HEADERS.map(() => ({ wch: 12 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '质检汇总')
  XLSX.writeFile(wb, `报废车辆质检汇总_${startDate}_${endDate}.xlsx`)
  return true
}

/** 报废车辆质检汇总表导出 Hook */
export function useQualityInspectionExport() {
  const exporting = ref(false)

  async function exportReport(
    params: QualityInspectionParams & { startDate: string; endDate: string }
  ) {
    exporting.value = true
    try {
      const res = await fetchQualityInspection({
        ...params,
        start_date: params.startDate,
        end_date: params.endDate,
        page: 1,
        limit: 9999
      })
      const ok = exportQualityInspectionExcel({
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

  return { exporting, exportReport, exportQualityInspectionExcel }
}
