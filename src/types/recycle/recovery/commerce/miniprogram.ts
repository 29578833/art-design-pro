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

/** 通知公告 */
export interface MiniNoticeItem {
  id: number
  title: string
  content: string
  is_show?: number
  sort?: number
  add_time?: number | string
  [key: string]: unknown
}

export interface MiniNoticeSaveParams {
  title: string
  content: string
  is_show?: number
  sort?: number
}

/** FAQ */
export interface MiniFaqItem {
  id: number
  question: string
  answer: string
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

export const FAQ_CATEGORIES = [
  '全部',
  '价格咨询',
  '回收流程',
  '车辆要求',
  '上门拖车',
  '手续办理',
  '支付结算',
  '其他'
] as const

/** 用户评价 */
export interface MiniReviewItem {
  id: number
  uid?: number
  nickname?: string
  avatar?: string
  order_id?: number
  order_no?: string
  score?: number
  content?: string
  images?: string[] | string
  tags?: string[] | string
  reply?: string
  reply_time?: string
  is_show?: number
  add_time?: number | string
  [key: string]: unknown
}

export interface MiniReviewStats {
  avg_score: number
  total_count: number
  good_count: number
  good_rate: number
}

/** 用户协议 */
export interface MiniAgreementItem {
  id: number
  title: string
  content: string
  type?: MiniAgreementType
  is_show?: number
  add_time?: number | string
  [key: string]: unknown
}

export type MiniAgreementType = 'user' | 'privacy' | 'service' | 'custom'

export const AGREEMENT_TYPE_MAP: Record<MiniAgreementType, string> = {
  user: '用户协议',
  privacy: '隐私政策',
  service: '服务条款',
  custom: '自定义'
}

export interface MiniAgreementSaveParams {
  title: string
  content: string
  type?: MiniAgreementType
  is_show?: number
}

/** 子页面 */
export type MiniSubPage = 'banner' | 'notice' | 'faq' | 'review' | 'agreement'

export const MINI_SUB_PAGE_CONFIG: Record<MiniSubPage, { label: string; icon: string }> = {
  banner: { label: '轮播图', icon: 'ri:image-line' },
  notice: { label: '通知公告', icon: 'ri:notification-3-line' },
  faq: { label: '常见问题', icon: 'ri:question-answer-line' },
  review: { label: '用户评价', icon: 'ri:star-line' },
  agreement: { label: '用户协议', icon: 'ri:file-text-line' }
}
