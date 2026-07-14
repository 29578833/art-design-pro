/** 收车汇总月度行 */
export interface ScrapSummaryMonthItem {
  month: string
  count: number
  personal: number
  enterprise: number
  avg_price: number
  total_amount: string
  yoy: number
}

/** 收车汇总报表 */
export interface ScrapSummaryResult {
  current_count: number
  yoy: number
  avg_price: number
  total_amount: string
  monthly: ScrapSummaryMonthItem[]
}

/** 业务员绩效行 */
export interface SalesPerformanceItem {
  uid: number
  name: string
  count: number
  amount: number
  avg_price: number
  rate: number
}

/** 业务员绩效报表 */
export interface SalesPerformanceResult {
  list: SalesPerformanceItem[]
  chart: {
    names: string[]
    counts: number[]
  }
}

/** 报表日期筛选 */
export interface ReportDateParams {
  start_date?: string
  end_date?: string
}

/** 数据决策看板统计（趋势分析用） */
export interface DecisionStatistics {
  purchase_trend?: number[]
  settlement_trend_data?: number[]
  overdue_count?: number
  pending_settlement_count?: number
  pending_settlement_amount?: number | string
  warehouse_count?: number
  [key: string]: unknown
}

/** 报表卡片 key */
export type ReportKey =
  | 'vehicle-summary'
  | 'dismantle-output'
  | 'settlement-summary'
  | 'salesman-perf'
  | 'waste-stat'
