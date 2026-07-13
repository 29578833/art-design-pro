import request from '@/utils/http'
import type {
  InventoryCategoryCounts,
  InventoryItem,
  InventoryItemSearchParams,
  InventoryItemStats,
  InventoryTransferParams
} from '@/types/recycle/inventory-item'

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

function buildListParams(params: InventoryItemSearchParams) {
  const { page, limit } = resolvePagination(params)
  return {
    page,
    limit,
    keyword: params.keyword?.trim() || '',
    category: params.category || '',
    status: params.status !== undefined && params.status !== '' ? params.status : ''
  }
}

/** 库存物品列表 */
export async function fetchInventoryItemList(params: InventoryItemSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<{ list: InventoryItem[]; count: number }>({
    url: '/scrap/inventory/item_list',
    params: query
  })
  return {
    records: res.list || [],
    total: res.count || 0,
    current: query.page,
    size: query.limit
  }
}

/** 库存统计 */
export async function fetchInventoryItemStats(): Promise<InventoryItemStats> {
  const res = await request.get<InventoryItemStats>({
    url: '/scrap/inventory/item_stats'
  })
  return {
    variety_count: res.variety_count || 0,
    reusable_count: res.reusable_count || 0,
    metal_weight: res.metal_weight || 0,
    total_value: res.total_value || 0,
    pending_out: res.pending_out || 0,
    location_rate: res.location_rate || 0,
    variety_text: res.variety_text || '0种',
    reusable_text: res.reusable_text || '0件',
    metal_weight_text: res.metal_weight_text || '0kg',
    total_value_text: res.total_value_text || '¥0',
    pending_out_text: res.pending_out_text || '0单',
    location_rate_text: res.location_rate_text || '0%'
  }
}

/** 分类数量 */
export async function fetchInventoryCategoryCounts(): Promise<InventoryCategoryCounts> {
  const res = await request.get<InventoryCategoryCounts>({
    url: '/scrap/inventory/category_counts'
  })
  return {
    total: res.total || 0,
    reusable: res.reusable || 0,
    metal: res.metal || 0,
    hazardous: res.hazardous || 0,
    general: res.general || 0
  }
}

/** 库存详情 */
export function fetchInventoryItemDetail(id: number) {
  return request.get<InventoryItem>({
    url: `/scrap/inventory/item_detail/${id}`
  })
}

/** 库位调拨 */
export function fetchInventoryTransfer(data: InventoryTransferParams) {
  return request.post({
    url: '/scrap/inventory/transfer',
    params: data,
    showSuccessMessage: true
  })
}

/** 导出库存列表 */
export async function fetchInventoryItemExport(params: InventoryItemSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<{ list: Record<string, string>[]; count?: number }>({
    url: '/scrap/inventory/item_export',
    params: {
      keyword: query.keyword,
      category: query.category,
      status: query.status
    }
  })
  return res.list || []
}
