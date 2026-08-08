/** 系统通知渠道状态：1开启 2关闭 */
export type NotificationSwitchStatus = 1 | 2

/** 通知渠道字段名 */
export type NotificationChannelType =
  'is_system' | 'is_sms' | 'is_wechat' | 'is_routine' | 'is_app' | 'is_ent_wechat'

/** 系统通知列表项（category_list 返回，接口原字段） */
export interface SystemNotificationItem {
  /** 主键 ID */
  id: number
  /** 通知标识 */
  mark?: string
  /** 通知名称 */
  name?: string
  /** 触发说明 */
  title?: string
  /** 角色编码：C/S/R/A/D/PS/PR/PF/PA/PM */
  role?: string
  /** 平台：mini_program / pc_admin */
  platform?: string
  /** 分类 */
  category?: string | number
  /** 排序 */
  sort?: number
  /** 是否开启系统内消息：1开启 2关闭 */
  is_system?: number
  /** 是否开启微信公众号：1开启 2关闭 */
  is_wechat?: number
  /** 是否开启短信：1开启 2关闭 */
  is_sms?: number
  /** 是否开启小程序订阅消息：1开启 2关闭 */
  is_routine?: number
  /** 是否开启企业微信：1开启 2关闭 */
  is_ent_wechat?: number
  /** 是否开启 APP：1开启 2关闭 */
  is_app?: number
  /** 系统内消息标题 */
  system_title?: string
  /** 系统内消息正文 */
  system_text?: string
  /** 短信内容 */
  sms_text?: string
  /** 模板变量（JSON 字符串） */
  variable?: string
  [key: string]: unknown
}

/** 系统通知分组（category_list 返回） */
export interface SystemNotificationGroup {
  /** 角色编码 */
  category: string
  /** 分组名称 */
  label: string
  /** 分组主色 */
  color: string
  /** 平台 */
  platform: string
  /** 分组内通知项 */
  items: SystemNotificationItem[]
}

/** 通知模板详情（template 接口返回） */
export interface SystemNotificationTemplate {
  /** 主键 ID */
  id: number
  /** 通知标识 */
  mark?: string
  /** 通知名称 */
  name?: string
  /** 触发说明 */
  title?: string
  /** 角色编码 */
  role?: string
  /** 平台 */
  platform?: string
  /** 系统内消息标题 */
  system_title?: string
  /** 系统内消息正文 */
  system_text?: string
  /** 微信公众号模板内容 */
  wechat_content?: string
  /** 微信公众号模板数据 */
  wechat_data?: string
  /** 小程序订阅消息内容 */
  routine_content?: string
  /** 小程序订阅消息数据 */
  routine_data?: string
  /** 短信内容 */
  sms_text?: string
  /** 企业微信内容 */
  ent_wechat_text?: string
  /** 可用变量列表 */
  variables?: string[]
}

/** 批量保存渠道状态参数（batch_save 提交项） */
export interface SystemNotificationBatchItem {
  /** 通知 ID */
  id: number
  /** 系统内消息：1开启 2关闭 */
  is_system?: number
  /** 微信公众号：1开启 2关闭 */
  is_wechat?: number
  /** 短信：1开启 2关闭 */
  is_sms?: number
  /** 小程序订阅消息：1开启 2关闭 */
  is_routine?: number
  /** 企业微信：1开启 2关闭 */
  is_ent_wechat?: number
  /** APP：1开启 2关闭 */
  is_app?: number
}

/** 保存通知模板参数（template_save） */
export interface SystemNotificationTemplateSaveParams {
  /** 通知 ID */
  id: number
  /** 系统内消息标题 */
  system_title?: string
  /** 系统内消息正文 */
  system_text?: string
  /** 微信公众号模板内容 */
  wechat_content?: string
  /** 微信公众号模板数据 */
  wechat_data?: string | string[]
  /** 小程序订阅消息内容 */
  routine_content?: string
  /** 小程序订阅消息数据 */
  routine_data?: string | string[]
  /** 短信内容 */
  sms_text?: string
  /** 企业微信内容 */
  ent_wechat_text?: string
}
