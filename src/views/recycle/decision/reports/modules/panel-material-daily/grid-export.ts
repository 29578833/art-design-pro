import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import { fetchMaterialDaily } from '@/api/recycle/report'
import type {
  MaterialDailyItem,
  MaterialDailyParams
} from '@/types/recycle/decision/reports/report'
import { MD_SUM_FIELDS, parseMdNumber } from './grid-columns'

export const MD_REPORT_TITLE = '原料日报表'
export const MD_COMPANY_NAME = '鑫广再生资源（上海）有限公司'

const HEADER1 = [
  '序号',
  '名称',
  '规格',
  '原料初期库数',
  '',
  '本日入库量',
  '',
  '本日出库数',
  '',
  '本月入库量',
  '',
  '本月出库累计',
  '',
  '本日结存',
  ''
]

const HEADER2 = [
  '',
  '',
  '',
  '重量',
  '数量',
  '重量',
  '数量',
  '重量',
  '数量',
  '重量',
  '数量',
  '重量',
  '数量',
  '重量',
  '数量'
]

function fmtDateLabel(start: string, end: string) {
  const fmt = (d: string) => {
    const [y, m, day] = d.split('-')
    return `${y}年${m}月${day}日`
  }
  return start === end ? fmt(start) : `${fmt(start)}—${fmt(end)}`
}

function buildBody(list: MaterialDailyItem[]) {
  return list.map((row, i) => [
    i + 1,
    row.name,
    row.spec,
    row.init_weight || '',
    row.init_count || '',
    row.today_in_weight || '',
    row.today_in_count || '',
    row.today_out_weight || '',
    row.today_out_count || '',
    row.month_in_weight || '',
    row.month_in_count || '',
    row.month_out_weight || '',
    row.month_out_count || '',
    row.stock_weight || '',
    row.stock_count || ''
  ])
}

function buildTotalRow(list: MaterialDailyItem[]) {
  const total: (string | number)[] = ['', '合计', '']
  MD_SUM_FIELDS.forEach((field) => {
    const sum = list.reduce((s, row) => s + parseMdNumber(row[field]), 0)
    if (field.includes('weight')) {
      total.push(sum ? sum.toFixed(2) : '')
    } else {
      total.push(sum || '')
    }
  })
  return total
}

export interface MdExportOptions {
  startDate: string
  endDate: string
  list: MaterialDailyItem[]
}

export function exportMaterialDailyExcel(options: MdExportOptions): boolean {
  const { startDate, endDate, list } = options
  if (!list.length) return false

  const ws = XLSX.utils.aoa_to_sheet([
    [MD_COMPANY_NAME],
    [`${MD_REPORT_TITLE}  日期：${fmtDateLabel(startDate, endDate)}`],
    HEADER1,
    HEADER2,
    ...buildBody(list),
    buildTotalRow(list),
    ['备注：'],
    ['分管副总', '', '', '', '', '在管主管', '', '', '', '', '填表人', '', '', '', '']
  ])
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
    { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
    { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
    { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
    { s: { r: 2, c: 3 }, e: { r: 2, c: 4 } },
    { s: { r: 2, c: 5 }, e: { r: 2, c: 6 } },
    { s: { r: 2, c: 7 }, e: { r: 2, c: 8 } },
    { s: { r: 2, c: 9 }, e: { r: 2, c: 10 } },
    { s: { r: 2, c: 11 }, e: { r: 2, c: 12 } },
    { s: { r: 2, c: 13 }, e: { r: 2, c: 14 } }
  ]
  ws['!cols'] = [{ wch: 5 }, { wch: 22 }, { wch: 8 }, ...Array(12).fill({ wch: 10 })]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, MD_REPORT_TITLE)
  XLSX.writeFile(wb, `${MD_REPORT_TITLE}_${startDate}_${endDate}.xlsx`)
  return true
}

/** 原料日报表导出 Hook */
export function useMaterialDailyExport() {
  const exporting = ref(false)

  async function exportReport(
    params: MaterialDailyParams & { startDate: string; endDate: string }
  ) {
    exporting.value = true
    try {
      const res = await fetchMaterialDaily({
        ...params,
        start_date: params.startDate,
        end_date: params.endDate,
        page: 1,
        limit: 200
      })
      const ok = exportMaterialDailyExcel({
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

  return { exporting, exportReport, exportMaterialDailyExcel }
}
