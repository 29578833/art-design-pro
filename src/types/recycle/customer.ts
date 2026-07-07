/** 客户分级展示样式 key（兼容固定配色） */
export type CustomerGrade = 'vip' | 'normal' | 'potential' | 'blacklist'

/** 主体类型：个人 / 企业 */
export type PartnerType = 'individual' | 'enterprise'

/** 合作商类型 */
export type CooperationType =
  | 'vehicle_supplier'
  | 'product_buyer'
  | 'towing'
  | 'equipment'
  | 'individual'

/** 客户 / 供应商分类 */
export type PartnerCategory = 'customer' | 'supplier'

/** 启用状态 */
export type PartnerStatus = 'active' | 'inactive'

/** 用户等级选项（来自 vip_list） */
export interface UserLevelOption {
  id: number
  name: string
  grade?: number
  discount?: number
  isShow?: number
}

/** 用户分组选项（来自 user_group/list） */
export interface UserGroupOption {
  id: number
  groupName: string
}

/** 客户供应商档案 */
export interface RecyclePartner {
  id: string
  code: string
  name: string
  phone: string
  levelId: number
  levelName: string
  groupId: number
  groupName: string
  category: PartnerCategory
  type: PartnerType
  /** 展示用分级 key，由等级名称推导 */
  grade: CustomerGrade
  cooperationType: CooperationType
  idCard?: string
  address?: string
  enterprise?: string
  creditCode?: string
  contactPerson?: string
  creditLimit?: number
  totalTradeAmount?: number
  totalVehicles: number
  lastDealDate: string
  status: PartnerStatus
  remark?: string
  createTime: string
}

/** 列表搜索参数 */
export interface PartnerSearchParams extends Api.Common.CommonSearchParams {
  /** useTable paginationKey 映射为 page/limit 时使用 */
  page?: number
  limit?: number
  keyword?: string
  category?: PartnerCategory | 'all'
  /** 客户类型（用户分组 id） */
  groupId?: number | 'all'
  /** 用户等级 id，all 表示不限 */
  levelId?: number | 'all'
  cooperationType?: CooperationType | 'all'
  status?: PartnerStatus | 'all'
}

/** 分页列表响应 */
export type PartnerList = Api.Common.PaginatedResponse<RecyclePartner>

/** 表单提交数据 */
export interface PartnerFormData {
  name: string
  phone: string
  groupId: number
  levelId: number
  idCard?: string
  address?: string
  enterprise?: string
  creditCode?: string
  contactPerson?: string
  status: PartnerStatus
  remark?: string
}

/** 分级统计 */
export interface GradeStatItem {
  levelId: number
  levelName: string
  count: number
}

/** 客户交车记录 */
export interface UserVehicleRecord {
  id: number
  orderNo: string
  plateNo: string
  brand: string
  model: string
  statusText: string
  amount: number
  date: string
}

/** 等级展示样式 */
export interface LevelDisplayStyle {
  label: string
  color: string
  bgColor: string
  icon: string
}

/** 客户分级配置（展示兜底） */
export const GRADE_CONFIG: Record<
  CustomerGrade,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  vip: { label: 'VIP客户', color: '#D4AF37', bgColor: '#FFFBE6', icon: 'ri:vip-crown-line' },
  normal: { label: '普通客户', color: '#1890FF', bgColor: '#E6F7FF', icon: 'ri:user-line' },
  potential: {
    label: '潜在客户',
    color: '#8C8C8C',
    bgColor: '#F5F5F5',
    icon: 'ri:user-search-line'
  },
  blacklist: { label: '黑名单', color: '#FF4D4F', bgColor: '#FFF1F0', icon: 'ri:alert-line' }
}

/** 根据等级名称推导展示样式 */
export function resolveLevelStyle(levelName: string, index = 0): LevelDisplayStyle {
  const name = levelName.toLowerCase()
  if (name.includes('vip'))
    return { ...GRADE_CONFIG.vip, label: levelName || GRADE_CONFIG.vip.label }
  if (name.includes('黑名单'))
    return { ...GRADE_CONFIG.blacklist, label: levelName || GRADE_CONFIG.blacklist.label }
  if (name.includes('潜在'))
    return { ...GRADE_CONFIG.potential, label: levelName || GRADE_CONFIG.potential.label }
  if (name.includes('普通'))
    return { ...GRADE_CONFIG.normal, label: levelName || GRADE_CONFIG.normal.label }

  const palette = Object.values(GRADE_CONFIG)
  const cfg = palette[index % palette.length]
  return { ...cfg, label: levelName || cfg.label }
}

/** 根据分组名称判断个人/企业（用于表单字段展示） */
export function resolvePartnerTypeFromGroup(groupName: string): PartnerType {
  return /企业|公司|单位|供应商/.test(groupName) ? 'enterprise' : 'individual'
}

/** 根据等级名称推导 grade key */
export function resolveGradeKey(levelName: string): CustomerGrade {
  const name = levelName.toLowerCase()
  if (name.includes('vip')) return 'vip'
  if (name.includes('黑名单')) return 'blacklist'
  if (name.includes('潜在')) return 'potential'
  return 'normal'
}

/** 合作商类型配置 */
export const COOPERATION_TYPE_CONFIG: Record<CooperationType, { label: string }> = {
  vehicle_supplier: { label: '报废汽车供应商' },
  product_buyer: { label: '产物回收商' },
  towing: { label: '拖车公司' },
  equipment: { label: '设备维修' },
  individual: { label: '个人' }
}

/** 主体类型配置 */
export const PARTNER_TYPE_CONFIG: Record<PartnerType, { label: string }> = {
  individual: { label: '个人' },
  enterprise: { label: '企业' }
}

/** 分类配置 */
export const PARTNER_CATEGORY_CONFIG: Record<PartnerCategory, { label: string }> = {
  customer: { label: '客户' },
  supplier: { label: '供应商' }
}

/** 状态配置 */
export const PARTNER_STATUS_CONFIG: Record<
  PartnerStatus,
  { label: string; type: 'success' | 'info' }
> = {
  active: { label: '正常', type: 'success' },
  inactive: { label: '禁用', type: 'info' }
}
