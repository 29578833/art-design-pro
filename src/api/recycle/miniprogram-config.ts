import request from '@/utils/http'
import type {
  MiniBannerItem,
  MiniBannerSaveParams,
  MiniFaqItem,
  MiniFaqSaveParams,
  MiniNoticeItem,
  MiniNoticeSaveParams
} from '@/types/recycle/miniprogram'

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

// ── 轮播图 ──

export async function fetchBannerList(params?: { page?: number; limit?: number }) {
  const res = await request.get<{ list: MiniBannerItem[]; count: number }>({
    url: '/scrap/config/banner_list',
    params: resolvePagination(params)
  })
  return { list: res.list || [], count: res.count || 0 }
}

export function fetchBannerSave(data: MiniBannerSaveParams) {
  return request.post({
    url: '/scrap/config/banner_save',
    params: data,
    showSuccessMessage: true
  })
}

export function fetchBannerUpdate(id: number, data: MiniBannerSaveParams) {
  return request.post({
    url: `/scrap/config/banner_update/${id}`,
    params: data,
    showSuccessMessage: true
  })
}

export function fetchBannerDelete(id: number) {
  return request.del({
    url: `/scrap/config/banner_delete/${id}`,
    showSuccessMessage: true
  })
}

export function fetchBannerSort(id: number, direction: 'up' | 'down') {
  return request.post({
    url: `/scrap/config/banner_sort/${id}`,
    params: { direction },
    showSuccessMessage: true
  })
}

// ── 公告 ──

export async function fetchNoticeList(params?: { page?: number; limit?: number }) {
  const res = await request.get<{ list: MiniNoticeItem[]; count: number }>({
    url: '/scrap/config/notice_list',
    params: resolvePagination(params)
  })
  return { list: res.list || [], count: res.count || 0 }
}

export function fetchNoticeSave(data: MiniNoticeSaveParams) {
  return request.post({
    url: '/scrap/config/notice_save',
    params: data,
    showSuccessMessage: true
  })
}

export function fetchNoticeUpdate(id: number, data: MiniNoticeSaveParams) {
  return request.post({
    url: `/scrap/config/notice_update/${id}`,
    params: data,
    showSuccessMessage: true
  })
}

export function fetchNoticeDelete(id: number) {
  return request.del({
    url: `/scrap/config/notice_delete/${id}`,
    showSuccessMessage: true
  })
}

// ── FAQ ──

export async function fetchFaqList(params?: { page?: number; limit?: number; category?: string }) {
  const paging = resolvePagination(params)
  const res = await request.get<{ list: MiniFaqItem[]; count: number }>({
    url: '/scrap/config/faq_list',
    params: {
      ...paging,
      category: params?.category || ''
    }
  })
  return { list: res.list || [], count: res.count || 0 }
}

export function fetchFaqSave(data: MiniFaqSaveParams) {
  return request.post({
    url: '/scrap/config/faq_save',
    params: data,
    showSuccessMessage: true
  })
}

export function fetchFaqUpdate(id: number, data: MiniFaqSaveParams) {
  return request.post({
    url: `/scrap/config/faq_update/${id}`,
    params: data,
    showSuccessMessage: true
  })
}

export function fetchFaqDelete(id: number) {
  return request.del({
    url: `/scrap/config/faq_delete/${id}`,
    showSuccessMessage: true
  })
}

/** FAQ 排序：direction 1 上移 / -1 下移 */
export function fetchFaqSort(id: number, direction: 1 | -1) {
  return request.post({
    url: `/scrap/config/faq_sort/${id}`,
    params: { direction },
    showSuccessMessage: true
  })
}
