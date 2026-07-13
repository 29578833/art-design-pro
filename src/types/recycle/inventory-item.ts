import type { ProductStoreCategory } from './product-store'
import { PRODUCT_STORE_CATEGORY_CONFIG } from './product-store'

// ==================== 库存物品 ====================

/** 库存状态：0在库 1已预留 2已入库 3已出库 */
export type InventoryItemStatus = 0 | 1 | 2 | 3

/** 库存物品列表项（接口 snake_case 原字段） */
export interface InventoryItem {
  id: number
  storage_no?: string
  item_no?: string
  item_name?: string
  category?: ProductStoreCategory
  category_text?: string
  spec?: string
  quantity?: number
  quantity_unit?: string
  quantity_text?: string
  weight?: number
  weight_unit?: string
  weight_text?: string
  location?: string
  unit_price?: number
  unit_price_text?: string
  total_value?: number
  total_value_text?: string
  vin?: string
  source_vin?: string
  store_time?: string
  entry_date?: string
  status: InventoryItemStatus
  status_text?: string
  status_key?: string
  remark?: string
  [key: string]: unknown
}

/** 列表查询参数 */
export interface InventoryItemSearchParams {
  keyword?: string
  category?: ProductStoreCategory | ''
  status?: InventoryItemStatus | ''
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 分类数量 */
export interface InventoryCategoryCounts {
  total: number
  reusable: number
  metal: number
  hazardous: number
  general: number
}

/** 库存统计 */
export interface InventoryItemStats {
  variety_count?: number
  reusable_count?: number
  metal_weight?: number
  total_value?: number
  pending_out?: number
  location_rate?: number
  variety_text: string
  reusable_text: string
  metal_weight_text: string
  total_value_text: string
  pending_out_text: string
  location_rate_text: string
}

/** 库位调拨参数 */
export interface InventoryTransferParams {
  item_id: number
  target_location: string
  reason?: string
}

/** 状态配置 */
export const INVENTORY_STATUS_CONFIG: Record<
  InventoryItemStatus,
  { label: string; color: string; bg: string }
> = {
  0: { label: '在库', color: '#52C41A', bg: '#F6FFED' },
  1: { label: '已预留', color: '#FA8C16', bg: '#FFF7E6' },
  2: { label: '已入库', color: '#1677ff', bg: '#E6F7FF' },
  3: { label: '已出库', color: '#8C8C8C', bg: '#F5F5F5' }
}

/** 分类筛选（复用产物分类配置） */
export const INVENTORY_CATEGORY_FILTERS: {
  label: string
  value: ProductStoreCategory | ''
}[] = [
  { label: '全部', value: '' },
  { label: PRODUCT_STORE_CATEGORY_CONFIG.reusable.label, value: 'reusable' },
  { label: PRODUCT_STORE_CATEGORY_CONFIG.metal.label, value: 'metal' },
  { label: PRODUCT_STORE_CATEGORY_CONFIG.hazardous.label, value: 'hazardous' },
  { label: PRODUCT_STORE_CATEGORY_CONFIG.general.label, value: 'general' }
]

/** 状态筛选 */
export const INVENTORY_STATUS_FILTER_OPTIONS: {
  label: string
  value: InventoryItemStatus | ''
}[] = [
  { label: '全部状态', value: '' },
  { label: '在库', value: 0 },
  { label: '已预留', value: 1 },
  { label: '已入库', value: 2 },
  { label: '已出库', value: 3 }
]
