import request from '@/utils/http'
import type {
  WarehouseAreaOverviewItem,
  WarehouseAreaSaveParams,
  WarehouseAreaSearchParams,
  WarehouseInboundVehicle,
  WarehouseInboundVehicleSearchParams,
  WarehouseLocationStats
} from '@/types/recycle/warehouse-location'

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

/** 库位统计 */
export async function fetchWarehouseLocationStats(): Promise<WarehouseLocationStats> {
  const res = await request.get<WarehouseLocationStats>({
    url: '/scrap/warehouse/location_stats'
  })
  return {
    area_count: res.area_count || 0,
    inbound_count: res.inbound_count || 0,
    today_entry: res.today_entry || 0,
    weigh_done: res.weigh_done || 0,
    entry_done: res.entry_done || 0,
    pending: res.pending || 0
  }
}

/** 仓库区域概览列表 */
export async function fetchWarehouseAreaOverview(params: WarehouseAreaSearchParams = {}) {
  return request.get<WarehouseAreaOverviewItem[]>({
    url: '/scrap/warehouse/area_overview',
    params: {
      keyword: params.keyword?.trim() || '',
      status: params.status !== undefined && params.status !== '' ? params.status : ''
    }
  })
}

/** 新增仓库区域 */
export function fetchWarehouseAreaSave(data: WarehouseAreaSaveParams) {
  return request.post({
    url: '/scrap/warehouse/area_save',
    params: data,
    showSuccessMessage: true
  })
}

/** 更新仓库区域 */
export function fetchWarehouseAreaUpdate(id: number, data: WarehouseAreaSaveParams) {
  return request.post({
    url: `/scrap/warehouse/area_update/${id}`,
    params: data,
    showSuccessMessage: true
  })
}

/** 删除仓库区域 */
export function fetchWarehouseAreaDelete(id: number) {
  return request.del({
    url: `/scrap/warehouse/area_delete/${id}`,
    showSuccessMessage: true
  })
}

/** 切换仓库区域状态 */
export function fetchWarehouseAreaToggleStatus(id: number) {
  return request.post({
    url: `/scrap/warehouse/area_toggle_status/${id}`,
    showSuccessMessage: true
  })
}

/** 已入库车辆列表 */
export async function fetchWarehouseInboundVehicles(params: WarehouseInboundVehicleSearchParams) {
  const { page, limit } = resolvePagination(params)
  const res = await request.get<{ list: WarehouseInboundVehicle[]; count: number }>({
    url: '/scrap/warehouse/inbound_vehicles',
    params: {
      page,
      limit,
      keyword: params.keyword?.trim() || '',
      vin: params.vin?.trim() || '',
      order_no: params.order_no?.trim() || '',
      warehouse_name: params.warehouse_name || ''
    }
  })
  return {
    records: res.list || [],
    total: res.count || 0,
    current: page,
    size: limit
  }
}
