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
