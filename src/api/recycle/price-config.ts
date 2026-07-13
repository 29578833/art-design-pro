import request from '@/utils/http'
import type {
  CollectPriceItem,
  CollectPriceSearchParams,
  InspectionItem,
  InspectionItemSearchParams
} from '@/types/recycle/system'

function resolvePagination(params?: {
  current?: number
  size?: number
  page?: number
  limit?: number
}) {
  return {
    page: Number(params?.page ?? params?.current ?? 1),
    limit: Number(params?.limit ?? params?.size ?? 50)
  }
}

/** 收车价格保存参数 */
export interface CollectPriceSaveParams {
  brand: string
  vehicle_type?: string
  vehicle_type_name?: string
  year_start?: number
  year_end?: number
  mileage_start?: number
  mileage_end?: number
  base_price: number
  sort?: number
  is_show?: 0 | 1
}

/** 收车价格列表 */
export async function fetchCollectPriceList(params?: CollectPriceSearchParams) {
  const paging = resolvePagination(params)
  const res = await request.get<{ list: CollectPriceItem[]; count: number }>({
    url: '/scrap/config/collect_price_list',
    params: {
      brand: params?.brand || '',
      vehicle_type: params?.vehicle_type || '',
      ...paging
    }
  })
  return {
    records: res.list || [],
    total: res.count || 0
  }
}

/** 新增收车价格 */
export function fetchCollectPriceSave(data: CollectPriceSaveParams) {
  return request.post({
    url: '/scrap/config/collect_price_save',
    params: {
      brand: data.brand,
      vehicle_type: data.vehicle_type || '',
      vehicle_type_name: data.vehicle_type_name || '',
      year_start: data.year_start ?? 0,
      year_end: data.year_end ?? 0,
      mileage_start: data.mileage_start ?? 0,
      mileage_end: data.mileage_end ?? 0,
      base_price: data.base_price,
      sort: data.sort ?? 0,
      is_show: data.is_show ?? 1
    },
    showSuccessMessage: true
  })
}

/** 修改收车价格 */
export function fetchCollectPriceUpdate(id: number, data: CollectPriceSaveParams) {
  return request.post({
    url: `/scrap/config/collect_price_update/${id}`,
    params: {
      brand: data.brand,
      vehicle_type: data.vehicle_type || '',
      vehicle_type_name: data.vehicle_type_name || '',
      year_start: data.year_start ?? 0,
      year_end: data.year_end ?? 0,
      mileage_start: data.mileage_start ?? 0,
      mileage_end: data.mileage_end ?? 0,
      base_price: data.base_price,
      sort: data.sort ?? 0,
      is_show: data.is_show ?? 1
    },
    showSuccessMessage: true
  })
}

/** 删除收车价格 */
export function fetchCollectPriceDelete(id: number) {
  return request.del({
    url: `/scrap/config/collect_price_delete/${id}`,
    showSuccessMessage: true
  })
}

/** 配件查验项目列表 */
export async function fetchInspectionItemList(params?: InspectionItemSearchParams) {
  const paging = resolvePagination({
    ...params,
    limit: params?.limit ?? params?.size ?? 200
  })
  const res = await request.get<{ list: InspectionItem[]; count: number }>({
    url: '/scrap/config/inspection_item_list',
    params: {
      category_id: params?.category_id ?? '',
      ...paging
    }
  })
  return {
    records: res.list || [],
    total: res.count || 0
  }
}

/** 更新配件扣款金额 */
export function fetchInspectionItemUpdate(id: number, deduction_amount: number) {
  return request.post({
    url: `/scrap/config/inspection_item_update/${id}`,
    params: { deduction_amount },
    showSuccessMessage: true
  })
}
