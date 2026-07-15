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

/** 从接口返回中提取图片 URL。 */
export function imgUrl(v: unknown) {
  if (!v) return ''
  if (typeof v === 'string') return v
  const o = v as Record<string, string>
  return o.url || o.src || o.att_dir || ''
}
