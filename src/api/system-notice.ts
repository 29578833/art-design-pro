import request from '@/utils/http'

/**
 * 获取系统通知（消息提醒）列表
 * @returns 通知列表
 */
export function fetchSystemNoticeList() {
  return request.get<Api.SystemNotice.SystemNoticeItem[]>({
    url: '/jnotice'
  })
}
