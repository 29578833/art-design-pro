// ==================== 系统管理 ====================

/** 管理员状态：0禁用 1启用 */
export type SystemAdminStatus = 0 | 1

/** 管理员列表项 */
export interface SystemAdminItem {
  /** 主键 ID */
  id: number
  /** 登录账号 */
  account?: string
  /** 真实姓名 */
  real_name?: string
  /** 手机号 */
  phone?: string
  /** 邮箱 */
  email?: string
  /** 角色 ID 列表或角色名称（接口可能返回逗号分隔字符串） */
  roles?: number[] | string
  /** 部门 */
  department?: string
  /** 状态：0禁用 1启用 */
  status: SystemAdminStatus
  /** 最后登录时间 */
  last_time?: number | string
  /** 最后登录时间文案 */
  _last_time?: string
  /** 最后登录 IP */
  last_ip?: string
  /** 创建时间 */
  add_time?: number | string
  /** 创建时间文案 */
  _add_time?: string
  /** 头像 */
  head_pic?: string
  /** 管理员级别 */
  level?: number
  [key: string]: unknown
}

/** 管理员列表查询 */
export interface SystemAdminSearchParams {
  /** 账号/姓名模糊搜索（对应接口 name 参数） */
  name?: string
  /** 角色 ID */
  roles?: number | string
  /** 状态 */
  status?: SystemAdminStatus | ''
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 管理员新增/编辑参数 */
export interface SystemAdminSaveParams {
  /** 登录账号 */
  account: string
  /** 密码 */
  pwd?: string
  /** 确认密码 */
  conf_pwd?: string
  /** 真实姓名 */
  real_name?: string
  /** 手机号 */
  phone?: string
  /** 邮箱 */
  email?: string
  /** 部门 */
  department?: string
  /** 角色 ID 列表 */
  roles?: number[] | number
  /** 状态 */
  status?: SystemAdminStatus
}

/** 重置密码参数 */
export interface SystemAdminResetPwdParams {
  /** 新密码 */
  pwd: string
  /** 确认密码 */
  conf_pwd: string
}

/** 角色状态：0禁用 1启用 */
export type SystemRoleStatus = 0 | 1

/** 系统角色列表项 */
export interface SystemRoleItem {
  /** 主键 ID */
  id: number
  /** 角色名称 */
  role_name?: string
  /** 角色描述 */
  role_desc?: string
  /** 状态：0禁用 1启用 */
  status: SystemRoleStatus
  /** 权限菜单 ID 或名称（接口可能返回逗号分隔） */
  rules?: string | number[]
  /** 关联管理员数量 */
  user_count?: number
  /** 小程序角色 */
  mini_program_roles?: string | string[]
  /** 角色级别 */
  level?: number
  [key: string]: unknown
}

/** 角色保存参数 */
export interface SystemRoleSaveParams {
  /** 角色名称 */
  role_name: string
  /** 角色描述 */
  role_desc?: string
  /** 状态 */
  status?: SystemRoleStatus
  /** 已选菜单权限 ID 列表 */
  checked_menus?: number[]
  /** 小程序角色 */
  mini_program_roles?: string[]
}

/** 角色菜单节点 */
export interface SystemRoleMenuNode {
  /** 菜单 ID */
  id: number
  /** 菜单名称 */
  title?: string
  /** 菜单标识 */
  menu_name?: string
  /** 父级 ID */
  pid?: number
  /** 是否开启查看按钮 */
  btn_view?: number
  /** 是否开启新增按钮 */
  btn_add?: number
  /** 是否开启编辑按钮 */
  btn_edit?: number
  /** 是否开启删除按钮 */
  btn_delete?: number
  /** 是否已勾选（接口可能返回） */
  checked?: boolean
  /** 子节点 */
  children?: SystemRoleMenuNode[]
  [key: string]: unknown
}

/** 角色编辑详情 */
export interface SystemRoleEditResult {
  /** 角色信息 */
  role: SystemRoleItem
  /** 权限菜单树 */
  menus: SystemRoleMenuNode[]
}

/** 数据字典状态：0禁用 1启用 */
export type DataDictStatus = 0 | 1

/** 左侧字典分类（system/crud/data_dictionary_list） */
export interface DataDictCategory {
  id: number
  /** 字典名称 */
  name?: string
  /** 字典标识（对应 scrap dict_type） */
  mark?: string
  /** 层级：0 一级 / 1 多级 */
  level?: number
  /** 状态 */
  status?: number
  add_time?: string
  [key: string]: unknown
}

/** 字典分类保存 */
export interface DataDictCategorySaveParams {
  name: string
  mark: string
  level?: number
  status?: number
}

/** 数据字典列表项 */
export interface DataDictItem {
  /** 主键 ID */
  id: number
  /** 字典类型 */
  dict_type?: string
  /** 字典标签 */
  dict_label?: string
  /** 字典值 */
  dict_value?: string
  /** 排序 */
  sort?: number
  /** 状态：0禁用 1启用 */
  status: DataDictStatus
  /** 备注 */
  remark?: string
  /** 创建时间 */
  add_time?: number | string
  /** 更新时间 */
  update_time?: number | string
  [key: string]: unknown
}

/** 数据字典列表查询 */
export interface DataDictSearchParams {
  /** 字典类型 */
  dict_type?: string
  /** 字典标签 */
  dict_label?: string
  /** 状态 */
  status?: DataDictStatus | ''
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 数据字典保存参数 */
export interface DataDictSaveParams {
  /** 字典类型 */
  dict_type: string
  /** 字典标签 */
  dict_label: string
  /** 字典值 */
  dict_value: string
  /** 排序 */
  sort?: number
  /** 状态 */
  status?: DataDictStatus
  /** 备注 */
  remark?: string
}

/** 收车价格配置项 */
export interface CollectPriceItem {
  /** 主键 ID */
  id?: number
  /** 品牌 */
  brand?: string
  /** 车辆类型编码 */
  vehicle_type?: string
  /** 车辆类型名称 */
  vehicle_type_name?: string
  /** 年份起始 */
  year_start?: number
  /** 年份结束 */
  year_end?: number
  /** 里程起始（万公里） */
  mileage_start?: number
  /** 里程结束（万公里） */
  mileage_end?: number
  /** 基础价格 */
  base_price?: number
  /** 排序 */
  sort?: number
  /** 是否显示：0否 1是 */
  is_show?: 0 | 1
  [key: string]: unknown
}

/** 收车价格列表查询 */
export interface CollectPriceSearchParams {
  /** 品牌 */
  brand?: string
  /** 车辆类型 */
  vehicle_type?: string
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 配件查验项目 */
export interface InspectionItem {
  /** 主键 ID */
  id: number
  /** 项目名称 */
  item_name?: string
  /** 扣款金额 */
  deduction_amount?: number
  /** 分类 ID */
  category_id?: number
  /** 分类名称 */
  category_name?: string
  /** 状态 */
  status?: number
  /** 排序 */
  sort?: number
  [key: string]: unknown
}

/** 配件查验列表查询 */
export interface InspectionItemSearchParams {
  /** 分类 ID */
  category_id?: number | string
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 操作日志列表项 */
export interface OperationLogItem {
  /** 主键 ID */
  id: number
  /** 业务模块 */
  module?: string
  /** 目标 ID */
  target_id?: number
  /** 操作动作 */
  action?: string
  /** 操作内容 */
  content?: string
  /** 操作人 ID */
  operator_id?: number
  /** 操作人姓名 */
  operator_name?: string
  /** 操作人角色 */
  operator_role?: string
  /** 操作 IP */
  ip?: string
  /** 操作时间 */
  add_time?: number | string
  [key: string]: unknown
}

/** 操作日志列表查询 */
export interface OperationLogSearchParams {
  /** 业务模块 */
  module?: string
  /** 关键词（模块/动作模糊搜索） */
  keyword?: string
  /** 开始时间 */
  start_time?: string
  /** 结束时间 */
  end_time?: string
  page?: number
  limit?: number
  current?: number
  size?: number
}

/** 系统通知项 */
export interface NotifyItem {
  /** 主键 ID */
  id: number
  /** 通知名称 */
  name?: string
  /** 通知标识 */
  mark?: string
  /** 通知类型 */
  type?: string
  /** 标题 */
  title?: string
  /** 是否开启系统通知 */
  is_system?: 0 | 1
  /** 是否开启短信 */
  is_sms?: 0 | 1
  /** 是否开启微信 */
  is_wechat?: 0 | 1
  /** 是否开启小程序 */
  is_routine?: 0 | 1
  /** 是否开启 APP */
  is_app?: 0 | 1
  /** 是否开启企业微信 */
  is_ent_wechat?: 0 | 1
  /** 系统通知标题 */
  system_title?: string
  /** 系统通知内容 */
  system_text?: string
  /** 短信模板 ID */
  sms_id?: string
  /** 短信内容 */
  sms_text?: string
  /** 微信模板 ID */
  tempid?: string
  /** 自定义触发条件 */
  custom_trigger?: string
  [key: string]: unknown
}

/** 通知保存参数 */
export interface NotifySaveParams {
  /** 通知 ID */
  id: number
  /** 通知类型字段名 */
  type?: string
  /** 通知名称 */
  name?: string
  /** 标题 */
  title?: string
  /** 是否开启系统通知 */
  is_system?: 0 | 1
  /** 是否开启短信 */
  is_sms?: 0 | 1
  /** 是否开启微信 */
  is_wechat?: 0 | 1
  /** 是否开启小程序 */
  is_routine?: 0 | 1
  /** 是否开启 APP */
  is_app?: 0 | 1
  /** 是否开启企业微信 */
  is_ent_wechat?: 0 | 1
  /** 系统通知标题 */
  system_title?: string
  /** 系统通知内容 */
  system_text?: string
  /** 通知标识 */
  mark?: string
  /** 短信模板 ID */
  sms_id?: string
  /** 短信内容 */
  sms_text?: string
  /** 微信模板 ID */
  tempid?: string
  /** 模板 key */
  tempkey?: string
  /** 通知内容 */
  content?: string
  [key: string]: unknown
}

/** 操作日志模块选项 */
export const OPERATION_LOG_MODULE_OPTIONS: { label: string; value: string }[] = [
  { label: '全部模块', value: '' },
  { label: '订单', value: 'order' },
  { label: '拖车', value: 'tow' },
  { label: '证件', value: 'certificate' },
  { label: '质检', value: 'quality' },
  { label: '仓储', value: 'warehouse' },
  { label: '拆解', value: 'dismantle' },
  { label: '结算', value: 'settlement' }
]
