import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import { fetchFinancialSettlement } from '@/api/recycle/report'
import type {
  FinancialSettlementItem,
  FinancialSettlementParams
} from '@/types/recycle/decision/reports/report'
import { fmtFsAmt, fmtFsText, parseFsNumber } from './grid-columns'

export const FS_REPORT_TITLE = '财务结算申请表'

const HEADERS = [
  '行号',
  '自编号',
  '我司车型',
  '车辆承类',
  '自主录入日期',
  '入库日期',
  '入库单号',
  '车辆档案单号',
  '回收订单号',
  '车辆产权人',
  '身份证/机构代码',
  '车主户口',
  '车主银行卡号',
  '代理人',
  '代理人身份证',
  '代理人手机号',
  '联系电话',
  '代理人户口',
  '代理人银行卡号',
  '车牌号',
  '车架号',
  '发动机号',
  '品牌型号',
  '车辆类型',
  '车辆数',
  '重量(吨)',
  '磅差位置',
  '实际磅位',
  '施车补贴(元/吨)',
  '施车补贴金额(元)',
  '运费类目',
  '道路运费(元/吨)',
  '结算类目',
  '结算价格(元/吨)',
  '竞价合同',
  '合同金额(元)',
  '应付金额(元)',
  '现金支付金额(元)',
  '服务费类目',
  '服务费(元/吨)',
  '服务费合计(元)',
  '正规费合计(元)',
  '本年总金额(元)',
  '合计(元)',
  '备注(业务员)',
  '结算单号',
  '其他费用',
  '分公司'
]

function rowToArray(r: FinancialSettlementItem, i: number) {
  return [
    i + 1,
    fmtFsText(r.vehicle_no),
    fmtFsText(r.my_vehicle_model),
    fmtFsText(r.vehicle_class),
    fmtFsText(r.entry_date),
    fmtFsText(r.warehouse_date),
    fmtFsText(r.warehouse_no),
    fmtFsText(r.archive_no),
    fmtFsText(r.order_no),
    fmtFsText(r.owner_name),
    fmtFsText(r.owner_id_number),
    fmtFsText(r.owner_address),
    fmtFsText(r.owner_bank_card),
    fmtFsText(r.agent_name),
    fmtFsText(r.agent_id_number),
    fmtFsText(r.agent_phone),
    fmtFsText(r.agent_contact),
    fmtFsText(r.agent_address),
    fmtFsText(r.agent_bank_card),
    fmtFsText(r.plate_no),
    fmtFsText(r.vin),
    fmtFsText(r.engine_no),
    fmtFsText(r.brand),
    fmtFsText(r.vehicle_type_text),
    fmtFsText(r.vehicle_count),
    fmtFsText(r.weight),
    fmtFsText(r.scale_diff),
    fmtFsText(r.actual_scale),
    fmtFsText(r.transport_subsidy),
    fmtFsText(r.transport_subsidy_amt),
    fmtFsText(r.freight_category),
    fmtFsText(r.freight_per_ton),
    fmtFsText(r.settlement_category),
    fmtFsText(r.settlement_price),
    fmtFsText(r.bidding_contract),
    fmtFsAmt(r.contract_amt) === '—' ? '' : parseFsNumber(r.contract_amt),
    fmtFsAmt(r.payable_amt) === '—' ? '' : parseFsNumber(r.payable_amt),
    fmtFsText(r.cash_pay_amt),
    fmtFsText(r.service_fee_category),
    fmtFsText(r.service_fee_per_ton),
    fmtFsAmt(r.service_fee_total) === '—' ? '' : parseFsNumber(r.service_fee_total),
    fmtFsAmt(r.regular_fee_total) === '—' ? '' : parseFsNumber(r.regular_fee_total),
    fmtFsAmt(r.year_total_amt) === '—' ? '' : parseFsNumber(r.year_total_amt),
    fmtFsAmt(r.grand_total) === '—' ? '' : parseFsNumber(r.grand_total),
    fmtFsText(r.remark),
    fmtFsText(r.settlement_no),
    fmtFsText(r.other_fee),
    fmtFsText(r.branch_office)
  ]
}

export function useFinanceSettlementExport() {
  const exporting = ref(false)

  async function exportReport(params: FinancialSettlementParams, dateLabel: string) {
    if (exporting.value) return
    exporting.value = true
    try {
      const res = await fetchFinancialSettlement({ ...params, page: 1, limit: 200 })
      const list = res.list || []
      const body = list.map((r, i) => rowToArray(r, i))
      const ws = XLSX.utils.aoa_to_sheet([[FS_REPORT_TITLE], [dateLabel], HEADERS, ...body])
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: HEADERS.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: HEADERS.length - 1 } }
      ]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '财务结算申请表')
      XLSX.writeFile(
        wb,
        `财务结算申请表_${params.entry_start_date || ''}_${params.entry_end_date || ''}.xlsx`
      )
      ElMessage.success('导出成功')
    } catch {
      ElMessage.error('导出失败')
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportReport }
}
