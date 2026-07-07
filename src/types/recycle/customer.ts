/** 客户分级 */
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

/** 客户供应商档案 */
export interface RecyclePartner {
  id: string
  code: string
  name: string
  phone: string
  category: PartnerCategory
  type: PartnerType
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
  keyword?: string
  category?: PartnerCategory | 'all'
  type?: PartnerType | 'all'
  grade?: CustomerGrade | 'all'
  cooperationType?: CooperationType | 'all'
  status?: PartnerStatus | 'all'
}

/** 分页列表响应 */
export type PartnerList = Api.Common.PaginatedResponse<RecyclePartner>

/** 表单提交数据 */
export type PartnerFormData = Omit<
  RecyclePartner,
  'id' | 'code' | 'totalVehicles' | 'lastDealDate' | 'totalTradeAmount' | 'createTime'
>

/** 分级统计 */
export interface GradeStatItem {
  grade: CustomerGrade
  count: number
}

/** 客户分级配置 */
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
