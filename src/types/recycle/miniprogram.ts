/** 小程序管理相关类型（接口 snake_case） */

/** 轮播图 */
export interface MiniBannerItem {
  id: number
  title?: string
  image?: string
  url?: string
  sort?: number
  is_show?: number
  add_time?: number | string
  [key: string]: unknown
}

export interface MiniBannerSaveParams {
  title: string
  image: string
  url?: string
  sort?: number
  is_show?: number
}

/** 公告 */
export interface MiniNoticeItem {
  id: number
  title?: string
  content?: string
  sort?: number
  is_show?: number
  add_time?: number | string
  [key: string]: unknown
}

export interface MiniNoticeSaveParams {
  title: string
  content: string
  sort?: number
  is_show?: number
}

/** FAQ */
export interface MiniFaqItem {
  id: number
  question?: string
  answer?: string
  category?: string
  sort?: number
  is_show?: number
  add_time?: number | string
  [key: string]: unknown
}

export interface MiniFaqSaveParams {
  question: string
  answer: string
  category?: string
  sort?: number
  is_show?: number
}

/** 协议 type：3 隐私政策 / 4 用户服务协议 / 5 报废回收服务协议 */
export type MiniAgreementType = 3 | 4 | 5

export interface MiniAgreementItem {
  id?: number
  type?: number
  title?: string
  content?: string
  version?: string
  effective_date?: string
  status?: number
  [key: string]: unknown
}

export interface MiniAgreementSaveParams {
  id?: number
  type: number
  title: string
  content: string
  version?: string
  effective_date?: string
}

/** 评价 */
export interface MiniReviewItem {
  id: number
  order_no?: string
  license_plate?: string
  rating?: number
  content?: string
  rela_name?: string
  phone?: string
  /** 官方回复存 make 字段 */
  make?: string
  /** 状态：1 正常 / 2 隐藏（以接口为准） */
  status?: number
  add_time?: string
  [key: string]: unknown
}

export interface MiniReviewSearchParams {
  order_no?: string
  license_plate?: string
  rating?: number | string
  time?: string
  page?: number
  limit?: number
  current?: number
  size?: number
}

export interface MiniReviewStats {
  avg_rating?: number
  total?: number
  star_counts?: Record<string | number, number>
  [key: string]: unknown
}

/** 入口子页标识 */
export type MiniSubPage = 'banner' | 'notice' | 'agreement' | 'faq' | 'reviews'

/** FAQ 分类（与原型一致，label/value 均为文字） */
export const FAQ_CATEGORIES = [
  '材料相关',
  '价格相关',
  '流程相关',
  '结算相关',
  '拖车相关',
  '其他'
] as const
