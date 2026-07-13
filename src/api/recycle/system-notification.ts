import request from '@/utils/http'
import type {
  NotificationChannelType,
  SystemNotificationInfo,
  SystemNotificationItem,
  SystemNotificationSaveParams
} from '@/types/recycle/system-notification'

/** 按 type 拉取单次通知列表 */
async function fetchNotificationListByType(type: number | string) {
  const res = await request.get<SystemNotificationItem[] | { list: SystemNotificationItem[] }>({
    url: '/setting/notification/index',
    params: { type }
  })
  if (Array.isArray(res)) return res
  return res?.list || []
}

/** 系统通知列表：type=1/2/3 各请求一次后合并 */
export async function fetchNotificationList() {
  const groups = await Promise.all([
    fetchNotificationListByType(1),
    fetchNotificationListByType(2),
    fetchNotificationListByType(3)
  ])
  return groups.flat()
}

/** 通知详情 */
export function fetchNotificationInfo(id: number, type: NotificationChannelType = 'is_system') {
  return request.get<SystemNotificationInfo>({
    url: '/setting/notification/info',
    params: { id, type }
  })
}

/** 保存通知设置 */
export function fetchNotificationSave(data: SystemNotificationSaveParams) {
  return request.post({
    url: '/setting/notification/save',
    params: {
      id: data.id,
      type: data.type,
      name: data.name || '',
      title: data.title || '',
      is_system: data.is_system ?? 0,
      is_app: data.is_app ?? 0,
      system_title: data.system_title || '',
      system_text: data.system_text || ''
    },
    showSuccessMessage: true
  })
}

/** 修改渠道开关 */
export function fetchNotificationSetStatus(
  type: NotificationChannelType,
  status: 0 | 1,
  id: number
) {
  return request.put({
    url: `/setting/notification/set_status/${type}/${status}/${id}`,
    showSuccessMessage: true
  })
}
