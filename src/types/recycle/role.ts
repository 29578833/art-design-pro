/** 质检员角色 ID */
export const QC_INSPECTOR_ROLE_ID = 2

/** 用户角色关联列表项（/scrap/role/user_role_list） */
export interface ScrapUserRoleItem {
  /** 关联记录 ID */
  id: number
  /** 账号（手机号） */
  account: string
  /** 角色 ID */
  role_id: number
  /** 是否当前激活角色：0否 1是 */
  is_active: number
  /** 添加时间 */
  add_time?: number
  /** 用户昵称 */
  nickname: string
  /** 手机号 */
  phone: string
  /** 头像 */
  avatar?: string
  /** 角色名称 */
  role_name: string
  /** 角色标识 */
  role_key: string
}

/** 用户角色列表查询参数 */
export interface ScrapUserRoleListParams {
  /** 角色 ID */
  role_id: number
  /** 当前页 */
  page?: number
  /** 每页条数 */
  limit?: number
  /** 账号筛选 */
  account?: string
}
