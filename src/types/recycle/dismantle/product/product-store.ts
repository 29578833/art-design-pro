// ==================== 产物入库 ====================

/** 产物分类 */
export type ProductStoreCategory = 'reusable' | 'metal' | 'hazardous' | 'general'

/** 产物状态：1待存储 2已入库 3已出库 */
export type ProductStoreStatus = 1 | 2 | 3

/** 产物入库列表项 */
export interface ProductStoreItem {
  id: number
  storage_no?: string
  item_name?: string
  remark?: string
  category?: ProductStoreCategory
  category_text?: string
  spec?: string
  quantity?: number
  quantity_unit?: string
  quantity_display?: string
  weight?: number
  weight_unit?: string
  weight_display?: string
  location?: string
  vin?: string
  source_task_id?: number
  status: ProductStoreStatus
  status_text?: string
  status_key?: string
  operator_id?: number
  operator_name?: string
  store_time?: string
  out_time?: string
  order_no?: string
  add_time?: number
  [key: string]: unknown
}

/** 列表查询参数 */
export interface ProductStoreSearchParams {
  keyword?: string
  category?: ProductStoreCategory | ''
  status?: ProductStoreStatus | ''
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 分类统计 */
export interface ProductStoreCategoryCounts {
  reusable: number
  metal: number
  hazardous: number
  general: number
}

/** 统计数据 */
export interface ProductStoreStats {
  reusable_count: string
  metal_weight: string
  hazardous_count: string
  today_count: string
  usage_rate: string
  category_distribution?: ProductStoreCategoryCounts
  metal_subcategories?: { name: string; weight: number }[]
}

/** 入库操作人 */
export interface ProductStoreOperator {
  id: number
  real_name?: string
  phone?: string
}

/** 新建入库明细行 */
export interface ProductStoreCreateItem {
  item_name: string
  category: ProductStoreCategory
  spec?: string
  quantity: number
  unit: string
  weight: number
  location: string
  vin?: string
  source_task_id?: number
  remark?: string
}

/** 新建入库单参数 */
export interface ProductStoreCreateParams {
  operator_id: number
  items: ProductStoreCreateItem[]
}

/** 分类标签配置 */
export const PRODUCT_STORE_CATEGORY_CONFIG: Record<
  ProductStoreCategory,
  { label: string; color: string; bg: string; icon: string; defaultUnit: string }
> = {
  reusable: {
    label: '回用件',
    color: '#1677ff',
    bg: '#E6F7FF',
    icon: 'ri:archive-line',
    defaultUnit: '件'
  },
  metal: {
    label: '废金属',
    color: '#52C41A',
    bg: '#F6FFED',
    icon: 'ri:stack-line',
    defaultUnit: '件'
  },
  hazardous: {
    label: '危险废物',
    color: '#FF4D4F',
    bg: '#FFF1F0',
    icon: 'ri:alert-line',
    defaultUnit: '批'
  },
  general: {
    label: '一般废物',
    color: '#8C8C8C',
    bg: '#F5F5F5',
    icon: 'ri:recycle-line',
    defaultUnit: '件'
  }
}

/** 状态标签配置 */
export const PRODUCT_STORE_STATUS_CONFIG: Record<
  ProductStoreStatus,
  { label: string; color: string; bg: string }
> = {
  1: { label: '待存储', color: '#FA8C16', bg: '#FFF7E6' },
  2: { label: '已入库', color: '#52C41A', bg: '#F6FFED' },
  3: { label: '已出库', color: '#8C8C8C', bg: '#F5F5F5' }
}

/** 分类筛选 */
export const PRODUCT_STORE_CATEGORY_FILTERS: {
  label: string
  value: ProductStoreCategory | ''
}[] = [
  { label: '全部', value: '' },
  { label: '回用件', value: 'reusable' },
  { label: '废金属', value: 'metal' },
  { label: '危险废物', value: 'hazardous' },
  { label: '一般废物', value: 'general' }
]

/** 状态筛选 */
export const PRODUCT_STORE_STATUS_FILTER_OPTIONS: {
  label: string
  value: ProductStoreStatus | ''
}[] = [
  { label: '全部状态', value: '' },
  { label: '待存储', value: 1 },
  { label: '已入库', value: 2 },
  { label: '已出库', value: 3 }
]
