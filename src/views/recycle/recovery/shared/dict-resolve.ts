import { flattenCllxCascade } from '@/types/recycle/system/data-dict'
import type { CllxCascadeNode } from '@/types/recycle/system/data-dict'

/** 下拉选项通用结构：label 为展示文本，value 为字典值（key）。 */
export interface DictLikeOption {
  label: string
  value: string | number
}

/** 归一化文本：去空白、统一半角括号、大写，便于 OCR 文本与字典标签比对。 */
function normText(s: string) {
  return String(s)
    .replace(/\s+/g, '')
    .replace(/[（）()]/g, '')
    .toUpperCase()
}

/**
 * 在字典选项中反查字典值。
 * OCR 识别到的是中文标签，而下拉表单（key/value）回填的是字典值，
 * 这里按「值 = 标签」反查，命中后返回字典值，使下拉框能正确回显。
 * 未命中时保留原值兜底，避免丢数据。
 */
export function resolveDictValue(raw: unknown, options: DictLikeOption[]): string {
  const text = String(raw ?? '')
  if (!text) return ''
  // 1) 已直接返回字典值（key），无需转换
  const byValue = options.find((o) => String(o.value) === text)
  if (byValue) return String(byValue.value)
  // 2) OCR 返回中文标签，反查匹配的字典值
  const target = normText(text)
  const byLabel = options.find((o) => normText(String(o.label)) === target)
  if (byLabel) return String(byLabel.value)
  // 3) 未命中，保留原文
  return text
}

/** 车辆类型级联树反查叶子节点的字典值。 */
export function resolveCllxValue(raw: unknown, nodes: CllxCascadeNode[]): string {
  if (!raw) return ''
  if (!nodes?.length) return String(raw)
  return resolveDictValue(raw, flattenCllxCascade(nodes))
}
