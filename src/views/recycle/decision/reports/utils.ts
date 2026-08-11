/** 报表默认日期范围：本月1日 ~ 今天 */
export function defaultReportDateRange(): [string, string] {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return [fmt(start), fmt(end)]
}

/** 原料日报表默认日期：当天 */
export function defaultTodayRange(): [string, string] {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return [s, s]
}

export type ReportTimeMode = 'day' | 'week' | 'month'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function formatDateYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** 按粒度计算区间（以 ref 所在天/周/月为基准） */
export function granRange(mode: ReportTimeMode, ref: Date = new Date()): [string, string] {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  if (mode === 'day') {
    const s = formatDateYmd(d)
    return [s, s]
  }
  if (mode === 'week') {
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1
    const mon = new Date(d)
    mon.setDate(d.getDate() - day)
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    return [formatDateYmd(mon), formatDateYmd(sun)]
  }
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return [formatDateYmd(first), formatDateYmd(last)]
}

/** 按粒度整体偏移日期区间 */
export function shiftGranRange(
  start: string,
  end: string,
  mode: ReportTimeMode,
  delta: number
): [string, string] {
  const s = new Date(start)
  if (mode === 'day') {
    s.setDate(s.getDate() + delta)
  } else if (mode === 'week') {
    s.setDate(s.getDate() + delta * 7)
  } else {
    s.setMonth(s.getMonth() + delta)
  }
  return granRange(mode, s)
}

/** 日期区间整体按天偏移 */
export function shiftDayRange(start: string, end: string, delta: number): [string, string] {
  const s = new Date(start)
  const e = new Date(end)
  s.setDate(s.getDate() + delta)
  e.setDate(e.getDate() + delta)
  return [formatDateYmd(s), formatDateYmd(e)]
}

export function formatCnDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${y}年${m}月${day}日`
}

export function formatCnDateRange(start: string, end: string) {
  return start === end ? formatCnDate(start) : `${formatCnDate(start)} — ${formatCnDate(end)}`
}

/** 收车汇总报表默认日期范围：近半年（含本月共 6 个自然月，取每月1日） */
export function defaultSixMonthsRange(): [string, string] {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return [fmt(start), fmt(end)]
}

/** 取 YYYY-MM-DD 所在月的最后一天（YYYY-MM-DD） */
export function lastDayOfMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}
