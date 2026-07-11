import request from '@/utils/http'
import type {
  WarehouseAreaOption,
  WarehouseEntryConfirmParams,
  WarehouseEntryConfirmResult,
  WarehouseEntryItem,
  WarehouseEntrySaveParams,
  WarehouseEntrySearchParams,
  WarehouseEntryStats,
  WarehouseLocationOption
} from '@/types/recycle/warehouse'

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

function buildEntryListParams(params: WarehouseEntrySearchParams) {
  const { page, limit } = resolvePagination(params)
  return {
    page,
    limit,
    keyword: params.keyword?.trim() || '',
    order_id: params.order_id || '',
    status: params.status || ''
  }
}

/** 待入厂车辆列表（原料入库队列） */
export async function fetchWarehouseEntryList(params: WarehouseEntrySearchParams) {
  const query = buildEntryListParams(params)
  const res = await request.get<{ list: WarehouseEntryItem[]; count: number }>({
    url: '/scrap/warehouse/entry_list',
    params: query
  })
  return {
    records: res.list || [],
    total: res.count || 0,
    current: query.page,
    size: query.limit
  }
}

/** 导出入库列表 */
export async function fetchWarehouseEntryExport(params: WarehouseEntrySearchParams) {
  return request.get<WarehouseEntryItem[]>({
    url: '/scrap/warehouse/entry_export',
    params: {
      keyword: params.keyword?.trim() || '',
      status: params.status || ''
    }
  })
}

/** 入场统计 */
export async function fetchWarehouseEntryStats(): Promise<WarehouseEntryStats> {
  const res = await request.get<WarehouseEntryStats>({
    url: '/scrap/warehouse/entry_counts'
  })
  return {
    pending: res.pending || 0,
    today: res.today || 0,
    entered: res.entered || 0
  }
}

/** 仓库区域列表（入库仓库下拉） */
export async function fetchWarehouseAreas() {
  return request.get<WarehouseAreaOption[]>({
    url: '/scrap/warehouse/warehouse_areas'
  })
}

/** 库位列表（按仓库区域筛选） */
export async function fetchWarehouseLocations(warehouseAreaId: number) {
  const res = await request.get<{ list: WarehouseLocationOption[]; count: number }>({
    url: '/scrap/warehouse/location_list',
    params: {
      warehouse_area_id: warehouseAreaId,
      page: 1,
      limit: 500
    }
  })
  return res.list || []
}

/** 全部库位列表（各仓库区域库位合并为一维数组） */
export async function fetchAllWarehouseLocations() {
  const res = await request.get<{ list: WarehouseLocationOption[]; count: number }>({
    url: '/scrap/warehouse/location_list',
    params: {
      page: 1,
      limit: 500
    }
  })
  return res.list || []
}

/** 确认原料入库 */
export async function confirmWarehouseEntry(data: WarehouseEntryConfirmParams) {
  return request.post<WarehouseEntryConfirmResult>({
    url: '/scrap/warehouse/entry_confirm',
    params: data,
    showSuccessMessage: true
  })
}

/** 手动登记入库 */
export async function saveWarehouseEntry(data: WarehouseEntrySaveParams) {
  return request.post({
    url: '/scrap/warehouse/entry_save',
    params: data,
    showSuccessMessage: true
  })
}
