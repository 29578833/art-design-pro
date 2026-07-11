import request from '@/utils/http'
import type { CllxCascadeNode } from '@/types/recycle/data-dict'

/** 车辆类型级联树 */
export function fetchCllxCascade() {
  return request.get<CllxCascadeNode[]>({
    url: '/scrap/data_dict/cllx_cascade'
  })
}
