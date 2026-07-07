import request from '@/utils/http'
import type {
  GradeStatItem,
  PartnerFormData,
  PartnerList,
  PartnerSearchParams,
  RecyclePartner,
  UserGroupOption,
  UserLevelOption,
  UserVehicleRecord
} from '@/types/recycle/customer'
import { resolveGradeKey, resolvePartnerTypeFromGroup } from '@/types/recycle/customer'

/** 过滤无效筛选值 */
function omitEmpty<T extends Record<string, unknown>>(params: T): Partial<T> {
  const result: Partial<T> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue
    result[key as keyof T] = value as T[keyof T]
  }
  return result
}

/** 格式化时间戳 */
function formatTimestamp(value: unknown): string {
  if (!value) return '—'
  if (typeof value === 'string' && value.includes('-')) return value.slice(0, 10)
  const ts = Number(value)
  if (!ts) return '—'
  const ms = ts > 1e12 ? ts : ts * 1000
  return new Date(ms).toISOString().slice(0, 10)
}

/** 列表项字段映射 */
function mapPartnerItem(raw: Record<string, unknown>): RecyclePartner {
  const uid = Number(raw.uid || 0)
  const levelName = String(raw.level || '无')
  const groupName = String(raw.group_id || '无')
  const normalizedGroupName = groupName === '无' ? '' : groupName
  const statusText = String(raw.status || '')

  return {
    id: String(uid),
    code: `KH${String(uid).padStart(8, '0')}`,
    name: String(raw.real_name || raw.nickname || ''),
    phone: String(raw.phone || ''),
    levelId: Number(raw.level_id || 0),
    levelName: levelName === '无' ? '' : levelName,
    groupId: Number(raw.group_id_num || 0),
    groupName: normalizedGroupName,
    category: 'customer',
    type: resolvePartnerTypeFromGroup(normalizedGroupName),
    grade: resolveGradeKey(levelName),
    cooperationType: 'individual',
    idCard: String(raw.card_id || ''),
    address: String(raw.addres || ''),
    totalTradeAmount: Number(raw.pay_count_money || raw.now_money || 0),
    totalVehicles: Number(raw.pay_count || 0),
    lastDealDate: formatTimestamp(raw.last_time || raw.add_time),
    status: statusText === '正常' || raw.status === 1 || raw.status === '1' ? 'active' : 'inactive',
    remark: String(raw.mark || ''),
    createTime: formatTimestamp(raw.add_time)
  }
}

/** 解析分页参数（兼容 useTable 的 page/limit 与 current/size） */
function resolvePagination(params: PartnerSearchParams) {
  return {
    page: Number(params.page ?? params.current ?? 1),
    limit: Number(params.limit ?? params.size ?? 20)
  }
}

/** 列表请求参数转换 */
function buildListParams(params: PartnerSearchParams) {
  const { page, limit } = resolvePagination(params)

  return omitEmpty({
    page,
    limit,
    nickname: params.keyword?.trim(),
    level: params.levelId,
    group_id: params.groupId,
    status: params.status === 'active' ? 1 : params.status === 'inactive' ? 0 : undefined
  })
}

/** 表单提交参数转换 */
function buildSavePayload(data: PartnerFormData, groupName = '') {
  const isIndividual = resolvePartnerTypeFromGroup(groupName) === 'individual'
  return {
    real_name: data.name,
    phone: data.phone,
    card_id: isIndividual ? data.idCard || '' : '',
    addres: data.address || '',
    mark: data.remark || '',
    level: data.levelId || 0,
    group_id: data.groupId || 0,
    status: data.status === 'active' ? 1 : 0
  }
}

/** 获取客户列表 */
export async function fetchPartnerList(params: PartnerSearchParams): Promise<PartnerList> {
  const res = await request.get<{ list: Record<string, unknown>[]; count: number }>({
    url: '/user/user',
    params: buildListParams(params)
  })

  const { page, limit } = resolvePagination(params)

  return {
    records: (res.list || []).map(mapPartnerItem),
    total: res.count || 0,
    current: page,
    size: limit
  }
}

/** 获取分级统计 */
export async function fetchPartnerGradeStats(): Promise<GradeStatItem[]> {
  const res = await request.get<{
    list: Array<{ level_id: number; level_name: string; user_count: number }>
  }>({
    url: '/user/user_counts'
  })

  return (res.list || []).map((item) => ({
    levelId: item.level_id,
    levelName: item.level_name,
    count: item.user_count
  }))
}

/** 获取用户等级列表 */
export async function fetchUserLevelList(): Promise<UserLevelOption[]> {
  const res = await request.get<{ list: Record<string, unknown>[] }>({
    url: '/user/user_level/vip_list',
    params: { page: 1, limit: 100, is_show: 1 }
  })

  return (res.list || []).map((item) => ({
    id: Number(item.id),
    name: String(item.name || ''),
    grade: Number(item.grade || 0),
    discount: Number(item.discount || 0),
    isShow: Number(item.is_show ?? 1)
  }))
}

/** 获取用户分组列表 */
export async function fetchUserGroupList(): Promise<UserGroupOption[]> {
  const res = await request.get<{ list: Record<string, unknown>[] }>({
    url: '/user/user_group/list',
    params: { page: 1, limit: 100 }
  })

  return (res.list || []).map((item) => ({
    id: Number(item.id),
    groupName: String(item.group_name || '')
  }))
}

/** 获取编辑表单原始数据 */
export async function fetchUserSaveInfo(uid: string | number) {
  return request.get<{
    userInfo: Record<string, unknown>
    levelInfo: Array<{ id: number; name: string }>
    groupInfo: Array<{ id: number; group_name: string }>
  }>({
    url: `/user/user/user_save_info/${uid}`
  })
}

/** 新增客户 */
export function fetchCreatePartner(data: PartnerFormData, groupName = '') {
  return request.post({
    url: '/user/user',
    params: buildSavePayload(data, groupName),
    showSuccessMessage: true
  })
}

/** 修改客户 */
export function fetchUpdatePartner(id: string | number, data: PartnerFormData, groupName = '') {
  return request.put({
    url: `/user/user/${id}`,
    params: buildSavePayload(data, groupName),
    showSuccessMessage: true
  })
}

/** 客户交车记录 */
export async function fetchUserVehicles(
  uid: string | number,
  params?: { page?: number; limit?: number }
): Promise<{ list: UserVehicleRecord[]; count: number }> {
  const res = await request.get<{ list: Record<string, unknown>[]; count: number }>({
    url: '/scrap/vehicle/user_vehicles',
    params: {
      uid,
      page: params?.page || 1,
      limit: params?.limit || 50
    }
  })

  const list = (res.list || []).map((item) => ({
    id: Number(item.id),
    orderNo: String(item.order_no || ''),
    plateNo: String(item.plate_no || '—'),
    brand: String(item.brand || ''),
    model: String(item.model || ''),
    statusText: String(item.status_text || ''),
    amount: Number(item.recycle_price || item.price || 0),
    date: formatTimestamp(item.add_time || item.update_time)
  }))

  return { list, count: res.count || list.length }
}
/** 导出用：拉取全量列表 */
export async function fetchPartnerListForExport(
  params: Omit<PartnerSearchParams, 'current' | 'size'>
): Promise<RecyclePartner[]> {
  const res = await fetchPartnerList({
    ...params,
    current: 1,
    size: 9999
  })
  return res.records
}
