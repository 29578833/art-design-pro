/** 操作日志列表项（接口原字段） */
export interface SystemLogItem {
  id: number
  admin_id?: number
  admin_name?: string
  page?: string
  path?: string
  path_name?: string
  ip?: string
  type?: string
  method?: string
  add_time?: number | string
}

/** 操作日志筛选参数 */
export interface SystemLogSearchParams {
  /** 前端搜索框：操作人/操作内容（提交时拆到 admin_id / pages / path） */
  keyword?: string
  pages?: string
  path?: string
  ip?: string
  admin_id?: number | string
  /** 时间范围，格式：YYYY/MM/DD - YYYY/MM/DD */
  data?: string
  current?: number
  size?: number
  page?: number
  limit?: number
}

/** 操作日志管理员筛选项 */
export interface SystemLogAdminOption {
  id: number
  real_name?: string
}
