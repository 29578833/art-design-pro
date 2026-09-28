import request from '@/utils/http'
import type {
  SystemEmployeeBrief,
  SystemEmployeeOption,
  SystemRoleEditResult,
  SystemRoleItem,
  SystemRoleMenuNode,
  SystemRoleSaveParams
} from '@/types/recycle/system/system'

/** 小程序角色选项 */
export interface ScrapRoleOption {
  id: number
  role_name?: string
  role_key?: string
  status?: number
  [key: string]: unknown
}

/** 系统角色列表 */
export async function fetchSystemRoleList(params?: {
  status?: number | string
  role_name?: string
  page?: number
  limit?: number
}) {
  const res = await request.get<{ list: SystemRoleItem[]; count: number }>({
    url: '/setting/role',
    params: {
      status: params?.status ?? '',
      role_name: params?.role_name || '',
      page: params?.page ?? 1,
      limit: params?.limit ?? 200
    }
  })
  return {
    list: res.list || [],
    count: res.count || 0
  }
}

/** 新建时权限树 */
export async function fetchSystemRoleMenus() {
  const res = await request.get<{ menus: SystemRoleMenuNode[] }>({
    url: '/setting/role/create'
  })
  return res.menus || []
}

/** 编辑回显 */
export async function fetchSystemRoleEdit(id: number): Promise<SystemRoleEditResult> {
  const res = await request.get<SystemRoleEditResult>({
    url: `/setting/role/${id}/edit`
  })
  return {
    role: res.role || ({ id } as SystemRoleItem),
    menus: res.menus || []
  }
}

/** 新建或保存角色（id=0 新增） */
export function fetchSystemRoleSave(id: number, data: SystemRoleSaveParams) {
  return request.post({
    url: `/setting/role/${id}`,
    params: {
      role_name: data.role_name,
      role_desc: data.role_desc || '',
      status: data.status ?? 1,
      checked_menus: data.checked_menus || [],
      mini_program_roles: data.mini_program_roles || [],
      view_scope: data.view_scope || 'all',
      view_employees: data.view_scope === 'assigned' ? data.view_employees || [] : [],
      edit_scope: data.edit_scope || 'all',
      edit_employees: data.edit_scope === 'assigned' ? data.edit_employees || [] : []
    },
    showSuccessMessage: true
  })
}

/** 删除角色 */
export function fetchSystemRoleDelete(id: number) {
  return request.del({
    url: `/setting/role/${id}`,
    showSuccessMessage: true
  })
}

/** 小程序角色选项 */
export async function fetchScrapRoleOptions() {
  const res = await request.get<{ list: ScrapRoleOption[]; count: number }>({
    url: '/scrap/role/list',
    params: { page: 1, limit: 200, status: 1 }
  })
  return res.list || []
}

/** 订单数据范围可选员工 */
export async function fetchSelectableEmployees(params?: {
  keyword?: string
  page?: number
  limit?: number
}) {
  const res = await request.get<{ list: SystemEmployeeOption[]; count: number }>({
    url: '/scrap/role/selectable_employees',
    params: {
      keyword: params?.keyword || '',
      page: params?.page ?? 1,
      limit: params?.limit ?? 200
    }
  })
  return {
    list: res.list || [],
    count: res.count ?? res.list?.length ?? 0
  }
}

/** 已选员工简要信息 */
export async function fetchEmployeeBrief(ids: number[] | string) {
  const employeeIds = Array.isArray(ids)
    ? [...new Set(ids.map(Number).filter((id) => id > 0))].join(',')
    : String(ids || '').trim()
  if (!employeeIds) return [] as SystemEmployeeBrief[]

  const res = await request.get<SystemEmployeeBrief[]>({
    url: '/scrap/role/employee_brief',
    params: { ids: employeeIds }
  })
  return Array.isArray(res) ? res : []
}
