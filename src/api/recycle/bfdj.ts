import request from '@/utils/http'
import type { BfdjHszmData } from '@/types/recycle/bfdj'

/** 回收证明打印数据 */
export function fetchBfdjPrintHszm(djid: string) {
  return request.get<BfdjHszmData>({
    url: '/scrap/bfdj/print_hszm',
    params: { id: djid }
  })
}
