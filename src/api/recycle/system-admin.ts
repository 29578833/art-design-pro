import request from '@/utils/http'
import type {
  SystemAdminItem,
  SystemAdminResetPwdParams,
  SystemAdminSaveParams,
  SystemAdminSearchParams,
  SystemAdminStatus,
  SystemRoleItem
} from '@/types/recycle/system'

/** FormBuilder 单条规则 */
interface FormBuilderRule {
  field?: string
  value?: unknown
  type?: string
  [key: string]: unknown
}

/** FormBuilder 表单响应 */
interface FormBuilderResult {
  rules?: FormBuilderRule[]
  title?: string
  action?: string
  method?: string
}

function resolvePagination(params: {
  current?: number
  size?: number
  page?: number
  limit?: number
}) {
  return {
    page: Number(params.page ?? params.current ?? 1),
    limit: Number(params.limit ?? params.size ?? 20)
  }
}

/** 从 FormBuilder rules 解析字段值 */
export function parseFormBuilderValues(res: FormBuilderResult | Record<string, unknown>) {
  const rules = (res as FormBuilderResult)?.rules || []
  const values: Record<string, unknown> = {}
  for (const rule of rules) {
    if (!rule?.field) continue
    values[rule.field] = rule.value
  }
  return values
}

/** 管理员列表 */
export async function fetchAdminList(params: SystemAdminSearchParams) {
  const { page, limit } = resolvePagination(params)
  const res = await request.get<{ list: SystemAdminItem[]; count: number }>({
    url: '/setting/admin',
    params: {
      page,
      limit,
      name: params.name?.trim() || '',
      roles: params.roles ?? '',
      status: params.status !== undefined && params.status !== '' ? params.status : ''
    }
  })
  return {
    records: res.list || [],
    total: res.count || 0,
    current: page,
    size: limit
  }
}

/** 新增管理员 */
export function fetchAdminCreate(data: SystemAdminSaveParams) {
  return request.post({
    url: '/setting/admin',
    params: {
      account: data.account,
      pwd: data.pwd || '',
      conf_pwd: data.conf_pwd || '',
      real_name: data.real_name || '',
      phone: data.phone || '',
      email: data.email || '',
      department: data.department || '',
      roles: Array.isArray(data.roles) ? data.roles : data.roles ? [data.roles] : [],
      status: data.status ?? 1
    },
    showSuccessMessage: true
  })
}

/** 编辑回显（解析 FormBuilder） */
export async function fetchAdminEditForm(
  id: number
): Promise<SystemAdminSaveParams & { id: number }> {
  const res = await request.get<FormBuilderResult>({
    url: `/setting/admin/${id}/edit`
  })
  const values = parseFormBuilderValues(res)
  const rolesRaw = values.roles
  let roles: number | number[] = 0
  if (Array.isArray(rolesRaw)) {
    roles = Number(rolesRaw[0]) || 0
  } else if (rolesRaw !== undefined && rolesRaw !== null && rolesRaw !== '') {
    roles = Number(rolesRaw) || 0
  }
  return {
    id,
    account: String(values.account || ''),
    real_name: String(values.real_name || ''),
    phone: String(values.phone || ''),
    email: String(values.email || ''),
    department: String(values.department || ''),
    roles,
    status: (Number(values.status) === 0 ? 0 : 1) as SystemAdminStatus,
    pwd: '',
    conf_pwd: ''
  }
}

/** 修改管理员 */
export function fetchAdminUpdate(id: number, data: SystemAdminSaveParams) {
  const rolesVal = Array.isArray(data.roles) ? (data.roles[0] ?? 0) : (data.roles ?? 0)
  return request.put({
    url: `/setting/admin/${id}`,
    params: {
      account: data.account,
      pwd: data.pwd || '',
      conf_pwd: data.conf_pwd || '',
      real_name: data.real_name || '',
      phone: data.phone || '',
      email: data.email || '',
      department: data.department || '',
      roles: rolesVal,
      status: data.status ?? 1
    },
    showSuccessMessage: true
  })
}

/** 删除管理员 */
export function fetchAdminDelete(id: number) {
  return request.del({
    url: `/setting/admin/${id}`,
    showSuccessMessage: true
  })
}

/** 重置密码 */
export function fetchAdminResetPwd(id: number, data: SystemAdminResetPwdParams) {
  return request.put({
    url: `/setting/reset_pwd/${id}`,
    params: {
      pwd: data.pwd,
      conf_pwd: data.conf_pwd
    },
    showSuccessMessage: true
  })
}

/** 修改状态 */
export function fetchAdminSetStatus(id: number, status: SystemAdminStatus) {
  return request.put({
    url: `/setting/set_status/${id}/${status}`,
    showSuccessMessage: true
  })
}

/** 角色下拉（身份列表，用于用户表单） */
export async function fetchAdminRoleOptions() {
  const res = await request.get<{ list: SystemRoleItem[]; count: number } | SystemRoleItem[]>({
    url: '/setting/role',
    params: { status: 1, page: 1, limit: 500 }
  })
  if (Array.isArray(res)) return res
  return res.list || []
}
