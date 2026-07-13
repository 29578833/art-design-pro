/** 系统通知列表项（接口原字段） */
export interface SystemNotificationItem {
  id: number
  name?: string
  title?: string
  mark?: string
  type?: number | string
  is_system?: number
  is_app?: number
  is_wechat?: number
  is_routine?: number
  is_sms?: number
  is_ent_wechat?: number
  system_title?: string
  system_text?: string
  sms_text?: string
  [key: string]: unknown
}

/** 通知渠道字段名 */
export type NotificationChannelType =
  | 'is_system'
  | 'is_sms'
  | 'is_wechat'
  | 'is_routine'
  | 'is_app'
  | 'is_ent_wechat'

/** 通知详情（info 接口） */
export interface SystemNotificationInfo extends SystemNotificationItem {
  content?: string
}

/** 保存站内信参数 */
export interface SystemNotificationSaveParams {
  id: number
  type: NotificationChannelType
  name?: string
  title?: string
  is_system?: number
  is_app?: number
  system_title?: string
  system_text?: string
}
