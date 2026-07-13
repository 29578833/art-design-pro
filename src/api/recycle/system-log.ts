import request from '@/utils/http'
import type {
  SystemLogAdminOption,
  SystemLogItem,
  SystemLogSearchParams
} from '@/types/recycle/system-log'

function resolvePagination(params?: {
  current?: number
  size?: number
  page?: number
  limit?: number
}) {
  return {
    page: Number(params?.page ?? params?.current ?? 1),
    limit: Number(params?.limit ?? params?.size ?? 20)
  }
}

/** 操作日志列表 */
export async function fetchSystemLogList(params?: SystemLogSearchParams) {
  const paging = resolvePagination(params)
  const res = await request.get<{ list: SystemLogItem[]; count: number }>({
    url: '/system/log',
    params: {
      pages: params?.pages || '',
      path: params?.path || '',
      ip: params?.ip || '',
      admin_id: params?.admin_id ?? '',
      data: params?.data || '',
      ...paging
    }
  })
  return {
    records: res.list || [],
    total: res.count || 0
  }
}

/** 操作日志管理员筛选项 */
export async function fetchSystemLogAdmins() {
  const res = await request.get<{ info: SystemLogAdminOption[] }>({
    url: '/system/log/search_admin'
  })
  return res.info || []
}
