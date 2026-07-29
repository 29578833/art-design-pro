/** 数据看板时间粒度 */
export type DashboardTimeType = 'today' | 'week' | 'month'

/** 车辆状态分布项 */
export interface DashboardStatusDistributionItem {
  /** 状态码 */
  status: number
  /** 数量 */
  count: number
  /** 状态文案 */
  status_text: string
}

/** 业务漏斗 */
export interface DashboardFunnelData {
  /** 质检完成 */
  qc_done?: number
  /** 拆解完成 */
  dismantle_done?: number
  /** 注销完成 */
  cancel_done?: number
  /** 结算完成 */
  settle_done?: number
}

/** 最近操作记录 */
export interface DashboardRecentLog {
  id?: number
  /** 模块 */
  module?: string
  /** 操作动作 */
  action?: string
  /** 详情内容 */
  content?: string
  /** 操作人 */
  operator_name?: string
  /** 操作角色 */
  operator_role?: string
  /** 时间（H:i） */
  add_time?: string
}

/** 数据看板统计（/scrap/statistics/index） */
export interface DashboardStatistics {
  /** 时间粒度 */
  time_type?: DashboardTimeType
  /** 周期文案 */
  period_label?: string
  /** 周期收车数 */
  period_orders_count?: number
  /** 周期环比 */
  period_trend?: string
  /** 上周期收车数 */
  prev_period_count?: number
  /** 周期拆解数 */
  period_dismantled_count?: number
  /** 周期结算笔数 */
  period_settlement_count?: number
  /** 周期结算金额 */
  period_settlement_amount?: number
  /** 本月收车数 */
  month_orders_count?: number
  /** 上月收车数 */
  last_month_orders_count?: number
  /** 在库车辆 */
  warehouse_count?: number
  /** 超30天未处理 */
  overdue_count?: number
  /** 在库变化 */
  warehouse_decrease?: number
  /** 待拆解 */
  pending_dismantle_count?: number
  /** 今日拆解 */
  today_dismantled_count?: number
  /** 本月拆解 */
  month_dismantled_count?: number
  /** 待拆解变化 */
  pending_dismantle_change?: number
  /** 今日拆解变化 */
  today_dismantle_change?: number
  /** 今日收车 */
  today_orders_count?: number
  /** 本月结算笔数 */
  settlement_count?: number
  /** 本月结算金额 */
  total_settlement_amount?: number
  /** 结算环比 */
  settlement_trend?: string
  /** 待结算笔数 */
  pending_settlement_count?: number
  /** 待结算金额 */
  pending_settlement_amount?: number
  /** 待结算变化 */
  pending_settlement_change?: number
  /** 商务部待受理 */
  business_pending_count?: number
  /** 本月商务部已受理 */
  business_month_count?: number
  /** 商务部待受理变化 */
  business_pending_change?: number
  /** 业务漏斗 */
  funnel_data?: DashboardFunnelData
  /** 状态分布 */
  status_distribution?: DashboardStatusDistributionItem[]
  /** 当年收车趋势（12个月） */
  purchase_trend?: number[]
  /** 当年结算趋势（万元，12个月） */
  settlement_trend_data?: number[]
  /** 最近操作 */
  recent_logs?: DashboardRecentLog[]
}
