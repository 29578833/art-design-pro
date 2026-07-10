import request from '@/utils/http'
import type {
  ScrapVehicle,
  ScrapVehicleDetail,
  VehicleList,
  VehicleSearchParams,
  VehicleStatusCounts,
  VehicleTab,
  VehicleTabCount
} from '@/types/recycle/vehicle'
import { VEHICLE_TAB_CONFIG } from '@/types/recycle/vehicle'

function resolvePagination(params: VehicleSearchParams) {
  return {
    page: Number(params.page ?? params.current ?? 1),
    limit: Number(params.limit ?? params.size ?? 20)
  }
}

/** Tab → 后端 status */
export function mapVehicleTabToStatus(tab: VehicleTab = 'all'): string {
  const cfg = VEHICLE_TAB_CONFIG.find((item) => item.tab === tab)
  return cfg?.status ?? ''
}

/** 构建列表请求参数 */
function buildListParams(params: VehicleSearchParams) {
  const { page, limit } = resolvePagination(params)
  const tab = params.tab || 'all'
  const status = params.status !== undefined ? params.status : mapVehicleTabToStatus(tab)

  return {
    page,
    limit,
    keyword: params.keyword?.trim() || '',
    plate_no: params.plate_no?.trim() || '',
    vin: params.vin?.trim() || '',
    status,
    phase: ''
  }
}

/** 报废车辆列表 */
export async function fetchVehicleList(params: VehicleSearchParams): Promise<VehicleList> {
  const { page, limit } = resolvePagination(params)
  const res = await request.get<{ list: ScrapVehicle[]; count: number }>({
    url: '/scrap/vehicle/list',
    params: buildListParams(params)
  })

  return {
    records: res.list || [],
    total: res.count || 0,
    current: page,
    size: limit
  }
}

/** 车辆状态统计 */
export async function fetchVehicleStatusCounts(
  params: Partial<VehicleSearchParams> = {}
): Promise<VehicleStatusCounts> {
  const res = await request.get<VehicleStatusCounts>({
    url: '/scrap/vehicle/status_counts',
    params: {
      keyword: params.keyword?.trim() || '',
      plate_no: params.plate_no?.trim() || '',
      vin: params.vin?.trim() || '',
      status: '',
      fuel_type: '',
      vehicle_type: '',
      owner_type: ''
    }
  })

  return {
    total: res.total || 0,
    transport: res.transport || 0,
    factory: res.factory || 0,
    cancellation: res.cancellation || 0,
    completed: res.completed || 0,
    status: res.status || {}
  }
}

/** Tab 计数（基于 status_counts） */
export async function fetchVehicleTabCounts(
  params: Partial<VehicleSearchParams> = {}
): Promise<VehicleTabCount[]> {
  const counts = await fetchVehicleStatusCounts(params)
  return VEHICLE_TAB_CONFIG.map((cfg) => ({
    tab: cfg.tab,
    label: cfg.label,
    count: Number(counts[cfg.countKey] ?? 0)
  }))
}

/** 车辆详情 */
export function fetchVehicleDetail(id: number) {
  return request.get<ScrapVehicleDetail>({
    url: `/scrap/vehicle/detail/${id}`
  })
}
