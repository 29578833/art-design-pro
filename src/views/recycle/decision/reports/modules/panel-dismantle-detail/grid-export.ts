import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import type {
  DismantleStorageItem,
  DismantleVehicleItem
} from '@/types/recycle/decision/reports/report'
import { formatCnDate } from '../../utils'
import { parseDdNumber } from './grid-columns'

export const DD_REPORT_TITLE = '车辆拆解报表'
export const DD_COMPANY_NAME = '鑫广再生资源（上海）有限公司'

function q(n: string | number) {
  const v = parseDdNumber(n)
  return v || ''
}

function w(n: string | number, digits = 2) {
  const v = parseDdNumber(n)
  return v ? v.toFixed(digits) : ''
}

export function useDismantleExport() {
  const exporting = ref(false)

  async function exportReport(
    vehicles: DismantleVehicleItem[],
    products: DismantleStorageItem[],
    dateStart: string,
    dateEnd: string
  ) {
    if (exporting.value) return
    exporting.value = true
    try {
      const L = 14
      const R = 7
      const totalCols = L + R
      const pad = (arr: (string | number)[], len: number) =>
        arr.length >= len ? arr.slice(0, len) : [...arr, ...Array(len - arr.length).fill('')]
      const makeRow = (lc: (string | number)[], rc: (string | number)[]) => [
        ...pad(lc, L),
        ...pad(rc, R)
      ]

      const leftRow = (r: DismantleVehicleItem, i: number): (string | number)[] => [
        i + 1,
        r.name,
        q(r.prev_wip_count),
        w(r.prev_wip_weight),
        q(r.today_receive_count),
        w(r.today_receive_weight),
        q(r.month_receive_count),
        w(r.month_receive_weight),
        q(r.today_dismantle_count),
        w(r.today_dismantle_weight),
        q(r.month_dismantle_count),
        w(r.month_dismantle_weight),
        q(r.today_wip_count),
        w(r.today_wip_weight)
      ]
      const rightRow = (p: DismantleStorageItem | null): (string | number)[] =>
        p
          ? [
              '',
              p.category,
              p.product_name,
              q(p.today_storage_count),
              w(p.today_storage_weight, 3),
              q(p.month_storage_count),
              w(p.month_storage_weight, 3) || '0'
            ]
          : ['', '', '', '', '', '', '']

      const maxDataRows = Math.max(vehicles.length, products.length)
      const aoa: (string | number)[][] = []
      aoa.push(pad([DD_COMPANY_NAME], totalCols))
      const r1 = Array(totalCols).fill('') as (string | number)[]
      r1[0] = DD_REPORT_TITLE
      r1[totalCols - 1] = `日期：${formatCnDate(dateStart)}`
      aoa.push(r1)
      aoa.push(
        makeRow(
          [
            '序号',
            '车型',
            '前期在制品',
            '',
            '本日领料',
            '',
            '本月累计领料',
            '',
            '本日拆解',
            '',
            '本月累计拆解',
            '',
            '本日累计在制品',
            ''
          ],
          ['', '产物缴库', '', '', '', '', '']
        )
      )
      aoa.push(
        makeRow(
          [
            '',
            '',
            '正常报废',
            '',
            '正常报废',
            '',
            '正常报废',
            '',
            '正常报废',
            '',
            '正常报废',
            '',
            '正常报废',
            ''
          ],
          ['', '类别', '产物名称', '本日缴库', '', '本月累计缴库', '']
        )
      )
      aoa.push(
        makeRow(
          [
            '',
            '',
            '数量(台)',
            '重量(吨)',
            '数量(台)',
            '重量(吨)',
            '数量(台)',
            '重量(吨)',
            '数量(台)',
            '重量(吨)',
            '数量(台)',
            '重量(吨)',
            '数量(台)',
            '重量(吨)'
          ],
          ['', '', '', '数量(件)', '重量(吨)', '数量(件)', '重量(吨)']
        )
      )

      for (let i = 0; i < maxDataRows; i++) {
        const lc =
          i < vehicles.length ? leftRow(vehicles[i], i) : (Array(L).fill('') as (string | number)[])
        const rc = i < products.length ? rightRow(products[i]) : rightRow(null)
        aoa.push(makeRow(lc, rc))
      }

      const sumV = (field: keyof DismantleVehicleItem) =>
        vehicles.reduce((s, r) => s + parseDdNumber(r[field] as string | number), 0)
      const sumP = (field: keyof DismantleStorageItem) =>
        products.reduce((s, r) => s + parseDdNumber(r[field] as string | number), 0)

      aoa.push(
        makeRow(
          [
            '合计',
            '',
            q(sumV('prev_wip_count')),
            sumV('prev_wip_weight').toFixed(2),
            q(sumV('today_receive_count')),
            sumV('today_receive_weight').toFixed(2),
            q(sumV('month_receive_count')),
            sumV('month_receive_weight').toFixed(2),
            q(sumV('today_dismantle_count')),
            sumV('today_dismantle_weight').toFixed(2),
            q(sumV('month_dismantle_count')),
            sumV('month_dismantle_weight').toFixed(2),
            q(sumV('today_wip_count')),
            sumV('today_wip_weight').toFixed(2)
          ],
          [
            '',
            '合计',
            '',
            '',
            sumP('today_storage_weight').toFixed(3),
            sumP('month_storage_count'),
            sumP('month_storage_weight').toFixed(3)
          ]
        )
      )
      aoa.push(pad(['备注：'], totalCols))

      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '车辆拆解报表')
      XLSX.writeFile(wb, `车辆拆解报表_${dateStart}_${dateEnd}.xlsx`)
      ElMessage.success('导出成功')
    } catch {
      ElMessage.error('导出失败')
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportReport }
}
