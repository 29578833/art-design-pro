import request from '@/utils/http'
import type {
  MiniReviewItem,
  MiniReviewSearchParams,
  MiniReviewStats
} from '@/types/recycle/miniprogram'

function resolvePagination(params?: MiniReviewSearchParams) {
  return {
    page: Number(params?.page ?? params?.current ?? 1),
    limit: Number(params?.limit ?? params?.size ?? 20)
  }
}

/** 评价列表（后端返回 data + count，统一映射为 list） */
export async function fetchReviewList(params?: MiniReviewSearchParams) {
  const paging = resolvePagination(params)
  const res = await request.get<{
    data?: MiniReviewItem[]
    list?: MiniReviewItem[]
    count: number
  }>({
    url: '/scrap/review/list',
    params: {
      order_no: params?.order_no || '',
      license_plate: params?.license_plate || '',
      rating: params?.rating ?? '',
      time: params?.time || '',
      ...paging
    }
  })
  return {
    list: res.list || res.data || [],
    count: res.count || 0
  }
}

/** 评分统计 */
export function fetchReviewStats() {
  return request.get<MiniReviewStats>({
    url: '/scrap/review/stats'
  })
}

/** 回复评价 */
export function fetchReviewReply(id: number, reply: string) {
  return request.put({
    url: `/scrap/review/reply/${id}`,
    params: { reply },
    showSuccessMessage: true
  })
}

/** 隐藏/取消隐藏评价 */
export function fetchReviewHide(id: number) {
  return request.put({
    url: `/scrap/review/hide/${id}`,
    showSuccessMessage: true
  })
}
