import request from '@/utils/http'
import type {
  SystemNotificationBatchItem,
  SystemNotificationGroup,
  SystemNotificationTemplate,
  SystemNotificationTemplateSaveParams
} from '@/types/recycle/system/system-notification'

/** 分类分组通知列表（新 UI） */
export function fetchNotificationCategoryList(params?: {
  /** 搜索关键词 */
  keyword?: string
  /** 角色编码 */
  role?: string
  /** 平台：mini_program / pc_admin */
  platform?: string
}) {
  return request.get<SystemNotificationGroup[]>({
    url: '/setting/notification/category_list',
    params: {
      keyword: params?.keyword || '',
      role: params?.role || '',
      platform: params?.platform || ''
    }
  })
}

/** 批量保存通知渠道状态 */
export function fetchNotificationBatchSave(items: SystemNotificationBatchItem[]) {
  return request.post({
    url: '/setting/notification/batch_save',
    params: { items },
    showSuccessMessage: true
  })
}

/** 重置通知为默认状态 */
export function fetchNotificationResetDefault() {
  return request.post({
    url: '/setting/notification/reset_default',
    showSuccessMessage: true
  })
}

/** 获取通知模板内容 */
export function fetchNotificationTemplate(id: number) {
  return request.get<SystemNotificationTemplate>({
    url: `/setting/notification/template/${id}`
  })
}

/** 保存通知模板内容 */
export function fetchNotificationTemplateSave(data: SystemNotificationTemplateSaveParams) {
  return request.post({
    url: '/setting/notification/template_save',
    params: data,
    showSuccessMessage: true
  })
}
