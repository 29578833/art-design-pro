/** 车辆类型级联节点（/scrap/data_dict/cllx_cascade） */
export interface CllxCascadeNode {
  /** 节点值：叶子节点为 dict_value，分类节点为前缀或尺寸文案 */
  value: string
  /** 显示名称 */
  label: string
  /** 子节点 */
  children?: CllxCascadeNode[]
}

/** 车辆类型扁平选项 */
export interface CllxFlatOption {
  /** dict_value */
  value: string
  /** 显示名称 */
  label: string
}

/** 将级联树扁平为一维叶子选项 */
export function flattenCllxCascade(nodes: CllxCascadeNode[]): CllxFlatOption[] {
  const result: CllxFlatOption[] = []

  function walk(items: CllxCascadeNode[]) {
    for (const node of items) {
      if (node.children?.length) {
        walk(node.children)
      } else {
        result.push({ value: node.value, label: node.label })
      }
    }
  }

  walk(nodes)
  return result
}
