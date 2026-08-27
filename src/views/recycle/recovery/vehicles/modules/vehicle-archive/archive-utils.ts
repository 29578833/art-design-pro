import { DISMANTLE_PHOTO_FALLBACK_KEYS, ENTRY_PHOTO_ITEMS } from './archive-constants'

/** 将未知值转为字符串，空值返回空串。 */
export function str(v: unknown) {
  return v === null || v === undefined ? '' : String(v)
}

/** 将后端日期格式转为 YYYY-MM-DD。 */
export function formatDate(raw: unknown) {
  if (!raw) return ''
  const s = String(raw)
  if (s.length === 8 && /^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  }
  return s
}

/** 判断字段是否有有效值。 */
export function hasVal(v: unknown) {
  return v !== '' && v !== null && v !== undefined
}

/** 判断数值字段是否为非零有效值。 */
export function nonZero(v: unknown) {
  return hasVal(v) && v !== 0 && v !== '0'
}

/** 过滤空 URL 后，计算当前槽位在预览列表中的索引。 */
export function previewIndexAt(urls: Array<string | undefined | null>, index: number) {
  return urls.slice(0, index + 1).filter(Boolean).length - 1
}

/** 从接口返回中提取图片 URL。 */
export function imgUrl(v: unknown) {
  if (!v) return ''
  if (typeof v === 'string') return v
  const o = v as Record<string, string>
  return o.url || o.src || o.att_dir || ''
}

/** 拆解照片 URL：优先 bfcj 缓存，无值时回退 vehicle/detail.dismantle_photos。 */
export function resolveDismantlePhotoUrl(
  cacheKey: string,
  scrapCache?: Record<string, unknown> | null,
  dismantlePhotos?: Record<string, unknown> | null
) {
  const cacheUrl = imgUrl(scrapCache?.[cacheKey])
  if (cacheUrl) return cacheUrl
  const fallbackKeys = DISMANTLE_PHOTO_FALLBACK_KEYS[cacheKey] || []
  for (const key of fallbackKeys) {
    const url = imgUrl(dismantlePhotos?.[key])
    if (url) return url
  }
  return ''
}

export interface EntryPhotoSlot {
  key: string
  label: string
  url: string
}

/** 拖车进场照片槽位（scrap/quality/get_by_order）。 */
export function buildEntryPhotoSlots(
  qualityPhotos?: Record<string, unknown> | null
): EntryPhotoSlot[] {
  return ENTRY_PHOTO_ITEMS.map((item) => ({
    key: item.field,
    label: item.label,
    url: imgUrl(qualityPhotos?.[item.field])
  }))
}

/** 批量上传结果。 */
export interface BatchFillResult {
  /** 成功填入数量。 */
  filled: number
  /** 超出槽位的图片数量。 */
  excess: number
}

/** 按槽位顺序依次上传多张图片。 */
export async function batchFillUploadSlots<T extends string>(
  fields: readonly T[],
  files: File[],
  upload: (field: T, file: File) => Promise<void>
): Promise<BatchFillResult> {
  const count = Math.min(fields.length, files.length)
  for (let i = 0; i < count; i++) {
    await upload(fields[i], files[i])
  }
  return {
    filled: count,
    excess: Math.max(0, files.length - fields.length)
  }
}
