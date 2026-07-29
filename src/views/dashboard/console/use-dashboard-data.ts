import { fetchDashboardStatistics } from '@/api/recycle/dashboard'
import { fetchSalesPerformance } from '@/api/recycle/report'
import type { DashboardStatistics } from '@/types/recycle/dashboard'
import type { SalesPerformanceItem } from '@/types/recycle/decision/reports/report'

export interface DashboardKpiItem {
  label: string
  num: number
  prefix?: string
  suffix?: string
  decimals?: number
  sub?: string
  subPrefix?: string
  subNum?: number
  subSuffix?: string
  trend?: string
  trendNum?: number
  trendSuffix?: string
  trendDecimals?: number
  up: boolean
  icon: string
  color: string
  bg: string
  sparkData: number[]
}

export interface DashboardFunnelStep {
  label: string
  value: number
  color: string
}

export interface DashboardStatusItem {
  name: string
  value: number
}

export interface DashboardTodoItem {
  label: string
  count: number
  color: string
  bg: string
}

export interface DashboardSalesmanItem {
  name: string
  vehicles: number
  amount: number
  avatar: string
}

export interface DashboardActivityItem {
  time: string
  user: string
  action: string
  detail: string
  color: string
}

const MODULE_COLORS: Record<string, string> = {
  order: '#1890FF',
  tow: '#13C2C2',
  vehicle: '#722ED1',
  quality: '#FA8C16',
  settlement: '#52C41A',
  accept: '#1890FF',
  dismantle: '#FA8C16'
}

const STATUS_COLORS = ['#13C2C2', '#FA8C16', '#722ED1', '#1890FF', '#52C41A']

const FUNNEL_COLORS = ['#1890FF', '#722ED1', '#FA8C16', '#52C41A', '#13C2C2']

function num(val: unknown, fallback = 0) {
  const n = Number(val)
  return Number.isFinite(n) ? n : fallback
}

function parseTrend(trend?: string) {
  const raw = String(trend || '+0%')
  const up = !raw.startsWith('-')
  const trendNum = Math.abs(parseFloat(raw.replace(/[%+]/g, '')) || 0)
  return { up, trendNum }
}

/** 去掉后端当年未到月份填的 0，避免 sparkline 被拉成下降 */
function trimYearTrend(data: number[] | undefined) {
  const list = (data || []).map((n) => num(n))
  if (!list.length) return [0]
  let end = list.length
  while (end > 1 && list[end - 1] === 0) end -= 1
  return list.slice(0, end)
}

/** 年度趋势 spark：去未来 0 + 去开头 0，避免「平线后突然翘尾」 */
function sparkFromYearTrend(data: number[] | undefined, size = 7) {
  const trimmed = trimYearTrend(data)
  let start = 0
  while (start < trimmed.length - 1 && trimmed[start] === 0) start += 1
  const valid = trimmed.slice(start)
  if (!valid.length) return [0]
  if (valid.length <= size) return valid
  return valid.slice(-size)
}

/** 无月度序列的 KPI：按环比方向生成 mini 折线，0 变化为平线 */
function buildTrendSpark(up: boolean, trendNum: number, points = 7) {
  if (trendNum === 0) return Array(points).fill(4)
  const start = up ? 3 : 6
  const end = up ? 6 : 3
  return Array.from({ length: points }, (_, i) => start + ((end - start) * i) / (points - 1))
}

function formatWan(amount: number) {
  return `约 ¥${(amount / 10000).toFixed(1)}万`
}

function statusCount(stats: DashboardStatistics | null, text: string) {
  return num(stats?.status_distribution?.find((item) => item.status_text === text)?.count)
}

export function buildDashboardKpiList(stats: DashboardStatistics | null): DashboardKpiItem[] {
  const purchaseSpark = sparkFromYearTrend(stats?.purchase_trend)
  const settleSpark = sparkFromYearTrend(stats?.settlement_trend_data)
  const periodTrend = parseTrend(stats?.period_trend)
  const settlementTrend = parseTrend(stats?.settlement_trend)
  const monthAmountWan = num(stats?.total_settlement_amount) / 10000
  const warehouseChange = num(stats?.warehouse_decrease)
  const pendingDismantleChange = num(stats?.pending_dismantle_change)
  const todayDismantleChange = num(stats?.today_dismantle_change)
  const pendingSettlementChange = num(stats?.pending_settlement_change)
  const businessPendingChange = num(stats?.business_pending_change)

  return [
    {
      label: '今日收车',
      num: num(stats?.today_orders_count),
      suffix: '辆',
      subPrefix: '本月共 ',
      subNum: num(stats?.month_orders_count),
      subSuffix: '辆',
      trendNum: periodTrend.trendNum,
      trendSuffix: '%',
      trendDecimals: 0,
      up: periodTrend.up,
      icon: 'ri:car-line',
      color: '#1890FF',
      bg: '#E6F7FF',
      sparkData: purchaseSpark
    },
    {
      label: '本月收车',
      num: num(stats?.month_orders_count),
      suffix: '辆',
      subPrefix: '上月 ',
      subNum: num(stats?.last_month_orders_count),
      subSuffix: '辆',
      trendNum: periodTrend.trendNum,
      trendSuffix: '%',
      trendDecimals: 0,
      up: periodTrend.up,
      icon: 'ri:line-chart-line',
      color: '#52C41A',
      bg: '#F6FFED',
      sparkData: purchaseSpark
    },
    {
      label: '在库车辆',
      num: num(stats?.warehouse_count),
      suffix: '辆',
      subPrefix: '超30天 ',
      subNum: num(stats?.overdue_count),
      subSuffix: '辆',
      trendNum: warehouseChange,
      trendSuffix: '辆',
      up: warehouseChange <= 0,
      icon: 'ri:archive-line',
      color: '#722ED1',
      bg: '#F9F0FF',
      sparkData: buildTrendSpark(warehouseChange <= 0, warehouseChange)
    },
    {
      label: '待拆解',
      num: num(stats?.pending_dismantle_count),
      suffix: '辆',
      subPrefix: '今日完成 ',
      subNum: num(stats?.today_dismantled_count),
      subSuffix: '辆',
      trendNum: pendingDismantleChange,
      trendSuffix: '辆',
      up: pendingDismantleChange >= 0,
      icon: 'ri:tools-line',
      color: '#FA8C16',
      bg: '#FFF7E6',
      sparkData: buildTrendSpark(pendingDismantleChange >= 0, pendingDismantleChange)
    },
    {
      label: '今日拆解',
      num: num(stats?.today_dismantled_count),
      suffix: '辆',
      subPrefix: '本月已拆 ',
      subNum: num(stats?.month_dismantled_count),
      subSuffix: '辆',
      trendNum: todayDismantleChange,
      trendSuffix: '辆',
      up: todayDismantleChange >= 0,
      icon: 'ri:checkbox-circle-line',
      color: '#13C2C2',
      bg: '#E6FFFB',
      sparkData: buildTrendSpark(todayDismantleChange >= 0, todayDismantleChange)
    },
    {
      label: '本月结算',
      num: monthAmountWan,
      prefix: '¥',
      suffix: '万',
      decimals: 1,
      subPrefix: '共 ',
      subNum: num(stats?.settlement_count),
      subSuffix: ' 笔',
      trendNum: settlementTrend.trendNum,
      trendSuffix: '%',
      trendDecimals: 0,
      up: settlementTrend.up,
      icon: 'ri:money-cny-circle-line',
      color: '#52C41A',
      bg: '#F6FFED',
      sparkData: settleSpark
    },
    {
      label: '待结算',
      num: num(stats?.pending_settlement_count),
      suffix: '辆',
      sub: formatWan(num(stats?.pending_settlement_amount)),
      trendNum: pendingSettlementChange,
      trendSuffix: '辆',
      up: pendingSettlementChange <= 0,
      icon: 'ri:time-line',
      color: '#FF7A00',
      bg: '#FFF2E8',
      sparkData: buildTrendSpark(pendingSettlementChange <= 0, pendingSettlementChange)
    },
    {
      label: '商务部待受理',
      num: num(stats?.business_pending_count),
      suffix: '件',
      subPrefix: '本月已受理 ',
      subNum: num(stats?.business_month_count),
      subSuffix: '件',
      trendNum: businessPendingChange,
      trendSuffix: '件',
      up: businessPendingChange >= 0,
      icon: 'ri:file-text-line',
      color: '#1890FF',
      bg: '#E6F7FF',
      sparkData: buildTrendSpark(businessPendingChange >= 0, businessPendingChange)
    }
  ]
}

export function buildDashboardFunnelSteps(
  stats: DashboardStatistics | null
): DashboardFunnelStep[] {
  const funnel = stats?.funnel_data || {}
  return [
    { label: '收车', value: num(stats?.month_orders_count), color: FUNNEL_COLORS[0] },
    { label: '质检完成', value: num(funnel.qc_done), color: FUNNEL_COLORS[1] },
    { label: '拆解完成', value: num(funnel.dismantle_done), color: FUNNEL_COLORS[2] },
    { label: '注销完成', value: num(funnel.cancel_done), color: FUNNEL_COLORS[3] },
    { label: '结算完成', value: num(funnel.settle_done), color: FUNNEL_COLORS[4] }
  ]
}

export function buildDashboardStatusItems(
  stats: DashboardStatistics | null
): DashboardStatusItem[] {
  return (stats?.status_distribution || []).map((item) => ({
    name: item.status_text || '—',
    value: num(item.count)
  }))
}

export function buildDashboardTodos(stats: DashboardStatistics | null): DashboardTodoItem[] {
  return [
    {
      label: '待审核订单',
      count: statusCount(stats, '待审核'),
      color: '#1890FF',
      bg: '#E6F7FF'
    },
    {
      label: '入厂查验',
      count: statusCount(stats, '入厂查验'),
      color: '#722ED1',
      bg: '#F9F0FF'
    },
    {
      label: '待领料拆解',
      count: statusCount(stats, '待领料'),
      color: '#FA8C16',
      bg: '#FFF7E6'
    },
    {
      label: '待结算',
      count: num(stats?.pending_settlement_count),
      color: '#52C41A',
      bg: '#F6FFED'
    },
    {
      label: '商务部待受理',
      count: num(stats?.business_pending_count),
      color: '#13C2C2',
      bg: '#E6FFFB'
    }
  ]
}

export function buildDashboardActivities(
  stats: DashboardStatistics | null
): DashboardActivityItem[] {
  return (stats?.recent_logs || []).map((log) => ({
    time: log.add_time || '—',
    user: log.operator_name || '系统',
    action: log.action || '操作',
    detail: log.content || '—',
    color: MODULE_COLORS[log.module || ''] || '#1890FF'
  }))
}

export function buildDashboardSalesmen(list: SalesPerformanceItem[]): DashboardSalesmanItem[] {
  return list.slice(0, 5).map((item) => ({
    name: item.name || '—',
    vehicles: num(item.count),
    amount: num(item.amount),
    avatar: (item.name || '—').slice(0, 1)
  }))
}

export function getDashboardMonthLabels() {
  return ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
}

export function useDashboardData() {
  const loading = ref(false)
  const stats = ref<DashboardStatistics | null>(null)
  const salesmen = ref<DashboardSalesmanItem[]>([])

  const kpiList = computed(() => buildDashboardKpiList(stats.value))
  const funnelSteps = computed(() => buildDashboardFunnelSteps(stats.value))
  const funnelMax = computed(() => Math.max(funnelSteps.value[0]?.value || 0, 1))
  const statusItems = computed(() => buildDashboardStatusItems(stats.value))
  const statusColors = STATUS_COLORS
  const statusTotal = computed(() => statusItems.value.reduce((sum, item) => sum + item.value, 0))
  const todos = computed(() => buildDashboardTodos(stats.value))
  const totalTodos = computed(() => todos.value.reduce((sum, item) => sum + item.count, 0))
  const activities = computed(() => buildDashboardActivities(stats.value))
  const purchaseTrend = computed(() => (stats.value?.purchase_trend || []).map((n) => num(n)))
  const settlementTrend = computed(() =>
    (stats.value?.settlement_trend_data || []).map((n) => num(n))
  )
  const monthLabels = computed(() => getDashboardMonthLabels())

  function currentMonthRange() {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { start_date: fmt(start), end_date: fmt(end) }
  }

  async function loadSalesmen() {
    try {
      const res = await fetchSalesPerformance(currentMonthRange())
      salesmen.value = buildDashboardSalesmen(res.list || [])
    } catch {
      salesmen.value = []
    }
  }

  async function loadData() {
    loading.value = true
    try {
      const [dashboardStats] = await Promise.all([
        fetchDashboardStatistics('month'),
        loadSalesmen()
      ])
      stats.value = dashboardStats
    } catch {
      stats.value = null
    } finally {
      loading.value = false
    }
  }

  onMounted(loadData)

  return {
    loading,
    stats,
    salesmen,
    kpiList,
    funnelSteps,
    funnelMax,
    statusItems,
    statusColors,
    statusTotal,
    todos,
    totalTodos,
    activities,
    purchaseTrend,
    settlementTrend,
    monthLabels,
    loadData
  }
}
