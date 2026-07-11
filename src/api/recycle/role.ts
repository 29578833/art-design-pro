import request from '@/utils/http'
import type { ScrapUserRoleItem, ScrapUserRoleListParams } from '@/types/recycle/role'

/** 用户角色关联列表 */
export async function fetchUserRoleList(params: ScrapUserRoleListParams) {
  const res = await request.get<{ list: ScrapUserRoleItem[]; count: number }>({
    url: '/scrap/role/user_role_list',
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 100,
      role_id: params.role_id,
      account: params.account || ''
    }
  })
  return res.list || []
}
