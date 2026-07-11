import request from '@/utils/http'
import type {
  ProductStoreCreateParams,
  ProductStoreItem,
  ProductStoreOperator,
  ProductStoreSearchParams,
  ProductStoreStats
} from '@/types/recycle/product-store'

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

function buildListParams(params: ProductStoreSearchParams) {
  const { page, limit } = resolvePagination(params)
  return {
    page,
    limit,
    keyword: params.keyword?.trim() || '',
    category: params.category || '',
    status: params.status !== undefined && params.status !== '' ? params.status : ''
  }
}

/** 产物入库列表 */
export async function fetchProductStoreList(params: ProductStoreSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<{
    list: ProductStoreItem[]
    count: number
  }>({
    url: '/scrap/product_store/list',
    params: query
  })
  return {
    records: res.list || [],
    total: res.count || 0,
    current: query.page,
    size: query.limit
  }
}

/** 产物入库统计 */
export async function fetchProductStoreStats(): Promise<ProductStoreStats> {
  const res = await request.get<ProductStoreStats>({
    url: '/scrap/product_store/stats'
  })
  return {
    reusable_count: res.reusable_count || '0件',
    metal_weight: res.metal_weight || '0kg',
    hazardous_count: res.hazardous_count || '0批',
    today_count: res.today_count || '0批',
    usage_rate: res.usage_rate || '0%',
    category_distribution: res.category_distribution,
    metal_subcategories: res.metal_subcategories || []
  }
}

/** 产物入库详情 */
export function fetchProductStoreDetail(id: number) {
  return request.get<ProductStoreItem>({
    url: '/scrap/product_store/detail',
    params: { id }
  })
}

/** 新建入库单（批量） */
export function fetchProductStoreCreate(data: ProductStoreCreateParams) {
  return request.post({
    url: '/scrap/product_store/create',
    params: data,
    showSuccessMessage: true
  })
}

/** 产物出库 */
export function fetchProductStoreOutbound(id: number) {
  return request.post({
    url: '/scrap/product_store/outbound',
    params: { id },
    showSuccessMessage: true
  })
}

/** 入库操作人列表 */
export function fetchProductStoreOperatorList() {
  return request.get<ProductStoreOperator[]>({
    url: '/scrap/product_store/operator_list'
  })
}

/** 导出产物入库 */
export async function fetchProductStoreExport(params: ProductStoreSearchParams) {
  const query = buildListParams(params)
  const res = await request.get<{ list: Record<string, string>[]; title?: string }>({
    url: '/scrap/product_store/export',
    params: {
      keyword: query.keyword,
      category: query.category,
      status: query.status
    }
  })
  return res.list || []
}
